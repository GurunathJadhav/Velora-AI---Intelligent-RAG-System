from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    correlation_id: Optional[str] = None
    code: str
    message: str
    timestamp: datetime = datetime.now()

class BaseAppException(Exception):
    def __init__(self, message: str, status_code: int = 500, code: str = "INTERNAL_SERVER_ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(self.message)

class ResourceNotFoundException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=404, code="RESOURCE_NOT_FOUND")

class UnauthorizedException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=401, code="UNAUTHORIZED")

class BadRequestException(BaseAppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400, code="BAD_REQUEST")
