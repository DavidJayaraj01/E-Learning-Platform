from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    LEARNER = "LEARNER"


class LessonType(str, Enum):
    """Lesson type enumeration"""
    VIDEO = "VIDEO"
    DOCUMENT = "DOCUMENT"
    IMAGE = "IMAGE"
    QUIZ = "QUIZ"


class VisibilityType(str, Enum):
    """Course visibility enumeration"""
    EVERYONE = "EVERYONE"
    SIGNED_IN = "SIGNED_IN"


class AccessType(str, Enum):
    """Course access type enumeration"""
    OPEN = "OPEN"
    INVITATION = "INVITATION"
    PAYMENT = "PAYMENT"


class LessonStatus(str, Enum):
    """User lesson progress status enumeration"""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class EnrollmentStatus(str, Enum):
    """Course enrollment status enumeration"""
    YET_TO_START = "YET_TO_START"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class QuizAttemptStatus(str, Enum):
    """Quiz attempt status enumeration"""
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"