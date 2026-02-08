from sqlalchemy import (
    Column, Integer, String, Boolean, DECIMAL, TIMESTAMP, TEXT, 
    ForeignKey, UniqueConstraint, CheckConstraint, ARRAY, Interval
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text
from sqlalchemy.dialects.postgresql import ENUM
from app.database.config import Base
from app.enums import (
    UserRole, LessonType, VisibilityType, AccessType, 
    LessonStatus, EnrollmentStatus, QuizAttemptStatus
)


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(ENUM(UserRole, values_callable=lambda x: [e.value for e in x], name='userrole'), nullable=False, default=UserRole.LEARNER)
    total_points = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    courses_created = relationship("Course", back_populates="course_admin")
    enrollments = relationship("CourseEnrollment", back_populates="user")
    lesson_progress = relationship("UserLessonProgress", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    reviews = relationship("CourseReview", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")
    responsible_lessons = relationship("Lesson", back_populates="responsible_user")


class Badge(Base):
    """Badge model"""
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    required_points = Column(Integer, nullable=False)
    description = Column(TEXT)

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    """User badges junction table"""
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Unique constraint
    __table_args__ = (UniqueConstraint('user_id', 'badge_id'),)

    # Relationships
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")


class Course(Base):
    """Course model"""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(TEXT)
    image_url = Column(String(500))
    tags = Column(ARRAY(String))  # Array of tags
    website_url = Column(String(500))
    published = Column(Boolean, default=False)
    visibility = Column(ENUM(VisibilityType, values_callable=lambda x: [e.value for e in x], name='visibilitytype'), default=VisibilityType.EVERYONE)
    access_type = Column(ENUM(AccessType, values_callable=lambda x: [e.value for e in x], name='accesstype'), default=AccessType.OPEN)
    price = Column(DECIMAL(10, 2), default=0)
    course_admin_id = Column(Integer, ForeignKey("users.id"))
    total_lessons = Column(Integer, default=0)
    total_duration = Column(Interval, server_default=text("'0 minutes'::interval"))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    course_admin = relationship("User", back_populates="courses_created")
    enrollments = relationship("CourseEnrollment", back_populates="course")
    lessons = relationship("Lesson", back_populates="course")
    quizzes = relationship("Quiz", back_populates="course")
    reviews = relationship("CourseReview", back_populates="course")
    views = relationship("CourseView", back_populates="course")
    invitations = relationship("CourseInvitation", back_populates="course")


class CourseEnrollment(Base):
    """Course enrollment model"""
    __tablename__ = "course_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    status = Column(ENUM(EnrollmentStatus, values_callable=lambda x: [e.value for e in x], name='enrollmentstatus'), default=EnrollmentStatus.YET_TO_START)
    time_spent = Column(Interval, server_default=text("'0 minutes'::interval"))
    completion_percentage = Column(Integer, default=0)

    # Unique constraint
    __table_args__ = (UniqueConstraint('course_id', 'user_id'),)

    # Relationships
    course = relationship("Course", back_populates="enrollments")
    user = relationship("User", back_populates="enrollments")


class Lesson(Base):
    """Lesson model"""
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    lesson_type = Column(ENUM(LessonType, values_callable=lambda x: [e.value for e in x], name='lessontype'), nullable=False)
    description = Column(TEXT)
    content = Column(TEXT)  # For storing RAG-generated or manually entered lesson content
    responsible_id = Column(Integer, ForeignKey("users.id"))
    order_index = Column(Integer, default=0)
    duration = Column(Interval, server_default=text("'0 minutes'::interval"))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    course = relationship("Course", back_populates="lessons")
    responsible_user = relationship("User", back_populates="responsible_lessons")
    video = relationship("LessonVideo", back_populates="lesson", uselist=False)
    document = relationship("LessonDocument", back_populates="lesson", uselist=False)
    image = relationship("LessonImage", back_populates="lesson", uselist=False)
    attachments = relationship("LessonAttachment", back_populates="lesson")
    user_progress = relationship("UserLessonProgress", back_populates="lesson")


class LessonVideo(Base):
    """Lesson video content"""
    __tablename__ = "lesson_videos"

    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True)
    url = Column(String(500), nullable=False)

    # Relationships
    lesson = relationship("Lesson", back_populates="video")


class LessonDocument(Base):
    """Lesson document content"""
    __tablename__ = "lesson_documents"

    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True)
    file_url = Column(String(500), nullable=False)
    allow_download = Column(Boolean, default=True)

    # Relationships
    lesson = relationship("Lesson", back_populates="document")


class LessonImage(Base):
    """Lesson image content"""
    __tablename__ = "lesson_images"

    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True)
    file_url = Column(String(500), nullable=False)
    allow_download = Column(Boolean, default=True)

    # Relationships
    lesson = relationship("Lesson", back_populates="image")


class LessonAttachment(Base):
    """Lesson attachments"""
    __tablename__ = "lesson_attachments"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(String(500))
    external_url = Column(String(500))
    description = Column(String(255))

    # Relationships
    lesson = relationship("Lesson", back_populates="attachments")


class Quiz(Base):
    """Quiz model"""
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    order_index = Column(Integer, default=0)

    # Relationships
    course = relationship("Course", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz")
    attempts = relationship("QuizAttempt", back_populates="quiz")


class QuizQuestion(Base):
    """Quiz question model"""
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(TEXT, nullable=False)
    order_index = Column(Integer, nullable=False)
    points_first = Column(Integer, default=10)
    points_second = Column(Integer, default=7)
    points_third = Column(Integer, default=5)
    points_more = Column(Integer, default=2)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question")
    attempt_answers = relationship("QuizAttemptAnswer", back_populates="question")


class QuestionOption(Base):
    """Question option model"""
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(TEXT, nullable=False)
    is_correct = Column(Boolean, default=False)
    order_index = Column(Integer)

    # Relationships
    question = relationship("QuizQuestion", back_populates="options")
    attempt_answers = relationship("QuizAttemptAnswer", back_populates="selected_option")


class UserLessonProgress(Base):
    """User lesson progress"""
    __tablename__ = "user_lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    status = Column(ENUM(LessonStatus, values_callable=lambda x: [e.value for e in x], name='lessonstatus'), default=LessonStatus.NOT_STARTED)
    completed_at = Column(TIMESTAMP, nullable=True)
    time_spent = Column(Interval, server_default=text("'0 minutes'::interval"))

    # Unique constraint
    __table_args__ = (UniqueConstraint('user_id', 'lesson_id'),)

    # Relationships
    user = relationship("User", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="user_progress")


class QuizAttempt(Base):
    """Quiz attempt model"""
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    attempt_number = Column(Integer, default=1)
    status = Column(ENUM(QuizAttemptStatus, values_callable=lambda x: [e.value for e in x], name='quizattemptstatus'), default=QuizAttemptStatus.IN_PROGRESS)
    started_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    completed_at = Column(TIMESTAMP, nullable=True)
    earned_points = Column(Integer, default=0)
    tab_switches = Column(Integer, default=0)  # Track tab switch violations

    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("QuizAttemptAnswer", back_populates="attempt")


class QuizAttemptAnswer(Base):
    """Quiz attempt answer model"""
    __tablename__ = "quiz_attempt_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    selected_option_id = Column(Integer, ForeignKey("question_options.id"), nullable=False)
    is_correct = Column(Boolean)

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="attempt_answers")
    selected_option = relationship("QuestionOption", back_populates="attempt_answers")


class CourseReview(Base):
    """Course review model"""
    __tablename__ = "course_reviews"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, CheckConstraint('rating >= 1 AND rating <= 5'), nullable=False)
    review_text = Column(TEXT)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Unique constraint
    __table_args__ = (UniqueConstraint('course_id', 'user_id'),)

    # Relationships
    course = relationship("Course", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class CourseView(Base):
    """Course view tracking"""
    __tablename__ = "course_views"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    course = relationship("Course", back_populates="views")


class CourseInvitation(Base):
    """Course invitation model for invitation-only courses"""
    __tablename__ = "course_invitations"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    inviter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invitee_email = Column(String(255), nullable=False)
    invitee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Resolved when user exists
    status = Column(String(20), default="pending")  # pending, accepted, declined, expired
    message = Column(TEXT, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    responded_at = Column(TIMESTAMP, nullable=True)

    # Unique constraint - one pending invitation per email per course
    __table_args__ = (UniqueConstraint('course_id', 'invitee_email', name='unique_course_invitation'),)

    # Relationships
    course = relationship("Course", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[inviter_id])
    invitee = relationship("User", foreign_keys=[invitee_id])