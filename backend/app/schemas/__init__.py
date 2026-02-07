# Schemas package initialization
from .misc import BadgeResponse
from .users import *
from .courses import *
from .lessons import *
from .quizzes import *

# Update forward references
from .users import UserWithBadges
from .courses import CourseWithDetails
from .lessons import LessonWithContent

# This resolves forward references
UserWithBadges.model_rebuild()
CourseWithDetails.model_rebuild()
LessonWithContent.model_rebuild()