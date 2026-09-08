from typing import Any, Optional
from fastapi import Request, status

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: Any = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: str = ""):
        msg = f"{resource} {identifier} was not found." if identifier else f"{resource} not found."
        super().__init__(code=f"{resource.upper()}_NOT_FOUND", message=msg, status_code=status.HTTP_404_NOT_FOUND)

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Invalid or expired authentication credentials"):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=status.HTTP_401_UNAUTHORIZED)

class ForbiddenException(AppException):
    def __init__(self, message: str = "You lack permissions to access or modify this resource"):
        super().__init__(code="FORBIDDEN_ACCESS", message=message, status_code=status.HTTP_403_FORBIDDEN)

class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists with conflicting attributes"):
        super().__init__(code="RESOURCE_CONFLICT", message=message, status_code=status.HTTP_409_CONFLICT)

async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": false,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 409:
        code = "CONFLICT"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": false,
            "error": {
                "code": code,
                "message": str(exc.detail)
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_msg = errors[0]["msg"] if errors else "Invalid request data."
    first_loc = " -> ".join([str(l) for l in errors[0].get("loc", [])]) if errors else ""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": false,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"{first_loc}: {first_msg}" if first_loc else first_msg,
                "details": exc.errors()
            }
        }
    )
