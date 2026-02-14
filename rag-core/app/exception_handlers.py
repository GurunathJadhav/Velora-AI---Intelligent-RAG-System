from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.exceptions import BaseAppException, ErrorResponse
import logging

logger = logging.getLogger(__name__)

async def app_exception_handler(request: Request, exc: BaseAppException):
    correlation_id = request.headers.get("X-Correlation-ID")
    error_response = ErrorResponse(
        correlation_id=correlation_id,
        code=exc.code,
        message=exc.message
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(mode='json')
    )

async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    correlation_id = request.headers.get("X-Correlation-ID")
    error_response = ErrorResponse(
        correlation_id=correlation_id,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred"
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(mode='json')
    )
