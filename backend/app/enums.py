from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    LEARNER = "learner"


class LessonType(str, Enum):
    """Lesson type enumeration"""
    VIDEO = "video"
    DOCUMENT = "document"
    IMAGE = "image"
    QUIZ = "quiz"


class VisibilityType(str, Enum):
    """Course visibility enumeration"""
    EVERYONE = "everyone"
    SIGNED_IN = "signed_in"


class AccessType(str, Enum):
    """Course access type enumeration"""
    OPEN = "open"
    INVITATION = "invitation"
    PAYMENT = "payment"


class LessonStatus(str, Enum):
    """User lesson progress status enumeration"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class EnrollmentStatus(str, Enum):
    """Course enrollment status enumeration"""
    YET_TO_START = "yet_to_start"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class QuizAttemptStatus(str, Enum):
    """Quiz attempt status enumeration"""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"