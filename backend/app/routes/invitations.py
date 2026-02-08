"""
Course Invitation Routes

Handles invitation-only course access:
- Admin/Instructor can send invitations by email
- Learners can view and accept/decline invitations
- Accepting an invitation automatically enrolls the user
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.database.config import get_async_session
from app.models.models import CourseInvitation, Course, User, CourseEnrollment
from app.dependencies.auth import get_current_active_user, require_instructor_or_admin
from app.enums import AccessType, EnrollmentStatus
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Course Invitations"])


# Schemas
class InvitationCreate(BaseModel):
    """Schema for creating an invitation"""
    course_id: int
    email: EmailStr
    message: Optional[str] = None


class InvitationResponse(BaseModel):
    """Schema for invitation response"""
    id: int
    course_id: int
    course_title: str
    inviter_name: str
    invitee_email: str
    status: str
    message: Optional[str]
    created_at: datetime
    responded_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class InvitationListResponse(BaseModel):
    """Schema for listing invitations"""
    invitations: List[InvitationResponse]
    total: int


# Admin Routes
@router.post("/courses/{course_id}/invitations", response_model=InvitationResponse)
async def send_invitation(
    course_id: int,
    invitation_data: InvitationCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Send a course invitation to a user by email.
    Only course admin or system admin can send invitations.
    """
    logger.info(f"=== SEND INVITATION REQUEST ===")
    logger.info(f"course_id={course_id}, email={invitation_data.email}, user={current_user.email} (id={current_user.id})")
    
    # Check if course exists and is invitation-only
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check permission - must be course admin or system admin
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if user_role != "admin" and current_user.id != course.course_admin_id:
        raise HTTPException(status_code=403, detail="You don't have permission to invite users to this course")
    
    # Check for existing pending invitation
    existing_result = await db.execute(
        select(CourseInvitation).where(
            and_(
                CourseInvitation.course_id == course_id,
                CourseInvitation.invitee_email == invitation_data.email.lower(),
                CourseInvitation.status == "pending"
            )
        )
    )
    existing = existing_result.scalars().first()
    
    if existing:
        raise HTTPException(status_code=409, detail="An invitation has already been sent to this email")
    
    # Check if user with this email exists and is already enrolled
    user_result = await db.execute(select(User).where(User.email == invitation_data.email.lower()))
    invitee = user_result.scalars().first()
    
    if invitee:
        # Check if already enrolled
        enrollment_result = await db.execute(
            select(CourseEnrollment).where(
                and_(
                    CourseEnrollment.course_id == course_id,
                    CourseEnrollment.user_id == invitee.id
                )
            )
        )
        if enrollment_result.scalars().first():
            raise HTTPException(status_code=409, detail="This user is already enrolled in the course")
    
    # Create invitation
    invitation = CourseInvitation(
        course_id=course_id,
        inviter_id=current_user.id,
        invitee_email=invitation_data.email.lower(),
        invitee_id=invitee.id if invitee else None,
        message=invitation_data.message,
        status="pending"
    )
    
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    
    return InvitationResponse(
        id=invitation.id,
        course_id=invitation.course_id,
        course_title=course.title,
        inviter_name=current_user.name,
        invitee_email=invitation.invitee_email,
        status=invitation.status,
        message=invitation.message,
        created_at=invitation.created_at,
        responded_at=invitation.responded_at
    )


@router.get("/courses/{course_id}/invitations", response_model=InvitationListResponse)
async def get_course_invitations(
    course_id: int,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Get all invitations for a course.
    Only course admin or system admin can view invitations.
    """
    # Check course exists and permission
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if user_role != "admin" and current_user.id != course.course_admin_id:
        raise HTTPException(status_code=403, detail="You don't have permission to view invitations for this course")
    
    # Build query
    query = select(CourseInvitation).where(CourseInvitation.course_id == course_id)
    if status_filter:
        query = query.where(CourseInvitation.status == status_filter)
    
    result = await db.execute(query.order_by(CourseInvitation.created_at.desc()))
    invitations = result.scalars().all()
    
    # Get inviter names
    inviter_ids = [inv.inviter_id for inv in invitations]
    inviters_result = await db.execute(select(User).where(User.id.in_(inviter_ids)))
    inviters = {u.id: u.name for u in inviters_result.scalars().all()}
    
    return InvitationListResponse(
        invitations=[
            InvitationResponse(
                id=inv.id,
                course_id=inv.course_id,
                course_title=course.title,
                inviter_name=inviters.get(inv.inviter_id, "Unknown"),
                invitee_email=inv.invitee_email,
                status=inv.status,
                message=inv.message,
                created_at=inv.created_at,
                responded_at=inv.responded_at
            )
            for inv in invitations
        ],
        total=len(invitations)
    )


@router.delete("/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """Cancel a pending invitation."""
    invitation_result = await db.execute(
        select(CourseInvitation).where(CourseInvitation.id == invitation_id)
    )
    invitation = invitation_result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Check permission
    course_result = await db.execute(select(Course).where(Course.id == invitation.course_id))
    course = course_result.scalars().first()
    
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if user_role != "admin" and current_user.id != course.course_admin_id:
        raise HTTPException(status_code=403, detail="You don't have permission to cancel this invitation")
    
    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending invitations")
    
    await db.delete(invitation)
    await db.commit()
    
    return {"message": "Invitation cancelled"}


# Learner Routes
@router.get("/my-invitations", response_model=InvitationListResponse)
async def get_my_invitations(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all course invitations for the current user.
    Matches by email address.
    """
    query = select(CourseInvitation).where(
        CourseInvitation.invitee_email == current_user.email.lower()
    )
    
    if status_filter:
        query = query.where(CourseInvitation.status == status_filter)
    
    result = await db.execute(query.order_by(CourseInvitation.created_at.desc()))
    invitations = result.scalars().all()
    
    # Get course titles and inviter names
    course_ids = [inv.course_id for inv in invitations]
    inviter_ids = [inv.inviter_id for inv in invitations]
    
    courses_result = await db.execute(select(Course).where(Course.id.in_(course_ids)))
    courses = {c.id: c.title for c in courses_result.scalars().all()}
    
    inviters_result = await db.execute(select(User).where(User.id.in_(inviter_ids)))
    inviters = {u.id: u.name for u in inviters_result.scalars().all()}
    
    return InvitationListResponse(
        invitations=[
            InvitationResponse(
                id=inv.id,
                course_id=inv.course_id,
                course_title=courses.get(inv.course_id, "Unknown Course"),
                inviter_name=inviters.get(inv.inviter_id, "Unknown"),
                invitee_email=inv.invitee_email,
                status=inv.status,
                message=inv.message,
                created_at=inv.created_at,
                responded_at=inv.responded_at
            )
            for inv in invitations
        ],
        total=len(invitations)
    )


@router.post("/invitations/{invitation_id}/accept")
async def accept_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Accept a course invitation and enroll in the course.
    """
    invitation_result = await db.execute(
        select(CourseInvitation).where(CourseInvitation.id == invitation_id)
    )
    invitation = invitation_result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Check if invitation is for this user
    if invitation.invitee_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="This invitation is not for you")
    
    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation has already been {invitation.status}")
    
    # Check if already enrolled
    enrollment_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == invitation.course_id,
                CourseEnrollment.user_id == current_user.id
            )
        )
    )
    if enrollment_result.scalars().first():
        # Update invitation status and return
        invitation.status = "accepted"
        invitation.responded_at = datetime.utcnow()
        invitation.invitee_id = current_user.id
        await db.commit()
        return {"message": "Invitation accepted (already enrolled)"}
    
    # Create enrollment
    enrollment = CourseEnrollment(
        course_id=invitation.course_id,
        user_id=current_user.id,
        status=EnrollmentStatus.YET_TO_START
    )
    db.add(enrollment)
    
    # Update invitation
    invitation.status = "accepted"
    invitation.responded_at = datetime.utcnow()
    invitation.invitee_id = current_user.id
    
    await db.commit()
    
    return {"message": "Invitation accepted! You are now enrolled in the course."}


@router.post("/invitations/{invitation_id}/decline")
async def decline_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Decline a course invitation.
    """
    invitation_result = await db.execute(
        select(CourseInvitation).where(CourseInvitation.id == invitation_id)
    )
    invitation = invitation_result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Check if invitation is for this user
    if invitation.invitee_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="This invitation is not for you")
    
    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation has already been {invitation.status}")
    
    # Update invitation
    invitation.status = "declined"
    invitation.responded_at = datetime.utcnow()
    invitation.invitee_id = current_user.id
    
    await db.commit()
    
    return {"message": "Invitation declined."}


# ===== Learner Request Invitation =====

class InvitationRequestCreate(BaseModel):
    """Schema for a learner requesting an invitation"""
    message: Optional[str] = None


@router.post("/request/{course_id}")
async def request_invitation(
    course_id: int,
    request_data: InvitationRequestCreate = InvitationRequestCreate(),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Learner requests an invitation for an invitation-only course.
    Creates a 'requested' status invitation that admin can approve/decline.
    """
    # Check if course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.access_type != AccessType.INVITATION.value and course.access_type != "INVITATION":
        raise HTTPException(status_code=400, detail="This course does not require an invitation")
    
    # Check if already enrolled
    enrollment_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == course_id,
                CourseEnrollment.user_id == current_user.id
            )
        )
    )
    if enrollment_result.scalars().first():
        raise HTTPException(status_code=409, detail="You are already enrolled in this course")
    
    # Check for existing pending request or invitation
    existing_result = await db.execute(
        select(CourseInvitation).where(
            and_(
                CourseInvitation.course_id == course_id,
                CourseInvitation.invitee_email == current_user.email.lower(),
                CourseInvitation.status.in_(["pending", "requested"])
            )
        )
    )
    existing = existing_result.scalars().first()
    
    if existing:
        if existing.status == "requested":
            raise HTTPException(status_code=409, detail="You have already requested an invitation for this course")
        else:
            raise HTTPException(status_code=409, detail="You already have a pending invitation for this course")
    
    # Create invitation request
    invitation = CourseInvitation(
        course_id=course_id,
        inviter_id=current_user.id,  # The requester is the inviter in this case
        invitee_email=current_user.email.lower(),
        invitee_id=current_user.id,
        message=request_data.message,
        status="requested"
    )
    
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    
    return {
        "message": "Invitation request sent! The course administrator will review your request.",
        "invitation_id": invitation.id
    }


@router.post("/invitations/{invitation_id}/approve")
async def approve_invitation_request(
    invitation_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Admin approves a learner's invitation request.
    Changes status from 'requested' to 'pending' (which learner can then accept).
    Or directly enrolls the user.
    """
    invitation_result = await db.execute(
        select(CourseInvitation).where(CourseInvitation.id == invitation_id)
    )
    invitation = invitation_result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation request not found")
    
    if invitation.status != "requested":
        raise HTTPException(status_code=400, detail="This is not a pending request")
    
    # Check permission
    course_result = await db.execute(select(Course).where(Course.id == invitation.course_id))
    course = course_result.scalars().first()
    
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if user_role != "admin" and current_user.id != course.course_admin_id:
        raise HTTPException(status_code=403, detail="You don't have permission to approve this request")
    
    # Approve: change status to 'pending' so learner sees it as an invitation they can accept
    invitation.status = "pending"
    invitation.inviter_id = current_user.id  # Update inviter to the approving admin
    
    await db.commit()
    
    return {"message": "Invitation request approved! The learner will be notified."}


@router.post("/invitations/{invitation_id}/reject")
async def reject_invitation_request(
    invitation_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Admin rejects a learner's invitation request.
    """
    invitation_result = await db.execute(
        select(CourseInvitation).where(CourseInvitation.id == invitation_id)
    )
    invitation = invitation_result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation request not found")
    
    if invitation.status != "requested":
        raise HTTPException(status_code=400, detail="This is not a pending request")
    
    # Check permission
    course_result = await db.execute(select(Course).where(Course.id == invitation.course_id))
    course = course_result.scalars().first()
    
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if user_role != "admin" and current_user.id != course.course_admin_id:
        raise HTTPException(status_code=403, detail="You don't have permission to reject this request")
    
    invitation.status = "declined"
    invitation.responded_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Invitation request rejected."}


@router.get("/requests/all", response_model=InvitationListResponse)
async def get_all_course_requests(
    status_filter: Optional[str] = "requested",
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_instructor_or_admin)
):
    """
    Get all course invitation requests across all courses.
    Admin-only endpoint to view and manage all pending requests.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    
    # Build query
    query = select(CourseInvitation)
    if status_filter:
        query = query.where(CourseInvitation.status == status_filter)
    
    # If instructor, only show requests for their courses
    if user_role == "instructor":
        course_result = await db.execute(
            select(Course.id).where(Course.course_admin_id == current_user.id)
        )
        course_ids = [c for c in course_result.scalars().all()]
        query = query.where(CourseInvitation.course_id.in_(course_ids))
    
    result = await db.execute(query.order_by(CourseInvitation.created_at.desc()))
    invitations = result.scalars().all()
    
    # Get course titles
    course_ids = [inv.course_id for inv in invitations]
    courses_result = await db.execute(select(Course).where(Course.id.in_(course_ids)))
    courses = {c.id: c.title for c in courses_result.scalars().all()}
    
    # Get inviter/requester names
    inviter_ids = [inv.inviter_id for inv in invitations]
    inviters_result = await db.execute(select(User).where(User.id.in_(inviter_ids)))
    inviters = {u.id: u.name for u in inviters_result.scalars().all()}
    
    return InvitationListResponse(
        invitations=[
            InvitationResponse(
                id=inv.id,
                course_id=inv.course_id,
                course_title=courses.get(inv.course_id, "Unknown Course"),
                inviter_name=inviters.get(inv.inviter_id, inv.invitee_email),
                invitee_email=inv.invitee_email,
                status=inv.status,
                message=inv.message,
                created_at=inv.created_at,
                responded_at=inv.responded_at
            )
            for inv in invitations
        ],
        total=len(invitations)
    )


# ===== Payment Endpoints =====

import stripe
from app.database.config import settings

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class PaymentCreate(BaseModel):
    """Schema for creating a Stripe checkout session"""
    course_id: int


class CheckoutSessionResponse(BaseModel):
    """Schema for checkout session"""
    session_id: str
    url: str


class PaymentResponse(BaseModel):
    """Schema for payment result"""
    success: bool
    message: str
    enrollment_id: Optional[int] = None
    transaction_id: Optional[str] = None


@router.post("/payment/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a Stripe Checkout session for course payment.
    """
    # Check course exists
    course_result = await db.execute(select(Course).where(Course.id == payment_data.course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.access_type != "PAYMENT":
        raise HTTPException(status_code=400, detail="This course is not a paid course")
    
    # Check if already enrolled
    enrollment_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == payment_data.course_id,
                CourseEnrollment.user_id == current_user.id
            )
        )
    )
    if enrollment_result.scalars().first():
        raise HTTPException(status_code=409, detail="You are already enrolled in this course")
    
    try:
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int((course.price or 0) * 100),  # Convert to cents
                    'product_data': {
                        'name': course.title,
                        'description': course.description or 'Premium course access',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{settings.frontend_url}/student/courses/{course.id}?payment=success",
            cancel_url=f"{settings.frontend_url}/student/courses?payment=cancelled",
            client_reference_id=f"{current_user.id}|{course.id}",
            customer_email=current_user.email,
            metadata={
                'user_id': str(current_user.id),
                'course_id': str(course.id),
                'user_email': current_user.email,
            }
        )
        
        return CheckoutSessionResponse(
            session_id=checkout_session.id,
            url=checkout_session.url
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/payment/process", response_model=PaymentResponse)
async def process_payment(
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Process a payment for a paid course and enroll the user.
    This is a simplified payment - in production, integrate with Stripe/Razorpay.
    """
    # Check course exists
    course_result = await db.execute(select(Course).where(Course.id == payment_data.course_id))
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.access_type != "PAYMENT":
        raise HTTPException(status_code=400, detail="This course is not a paid course")
    
    # Check if already enrolled
    enrollment_result = await db.execute(
        select(CourseEnrollment).where(
            and_(
                CourseEnrollment.course_id == payment_data.course_id,
                CourseEnrollment.user_id == current_user.id
            )
        )
    )
    if enrollment_result.scalars().first():
        raise HTTPException(status_code=409, detail="You are already enrolled in this course")
    
    # Simulate payment processing
    import uuid
    transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    
    # Create enrollment
    enrollment = CourseEnrollment(
        course_id=payment_data.course_id,
        user_id=current_user.id,
        status=EnrollmentStatus.YET_TO_START
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    return PaymentResponse(
        success=True,
        message=f"Payment of ${course.price:.2f} processed successfully! You are now enrolled.",
        enrollment_id=enrollment.id,
        transaction_id=transaction_id
    )


@router.post("/payment/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Handle Stripe webhook events for payment completion.
    This endpoint is called by Stripe when payment is successful.
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Extract metadata
        user_id = int(session['metadata']['user_id'])
        course_id = int(session['metadata']['course_id'])
        
        # Check if enrollment already exists
        enrollment_result = await db.execute(
            select(CourseEnrollment).where(
                and_(
                    CourseEnrollment.course_id == course_id,
                    CourseEnrollment.user_id == user_id
                )
            )
        )
        existing_enrollment = enrollment_result.scalars().first()
        
        if not existing_enrollment:
            # Create enrollment
            enrollment = CourseEnrollment(
                course_id=course_id,
                user_id=user_id,
                status=EnrollmentStatus.YET_TO_START
            )
            db.add(enrollment)
            await db.commit()
            
            print(f"✓ Enrollment created for user {user_id} in course {course_id} via Stripe payment {session['id']}")
        else:
            print(f"ℹ Enrollment already exists for user {user_id} in course {course_id}")
    
    return {"status": "success"}
