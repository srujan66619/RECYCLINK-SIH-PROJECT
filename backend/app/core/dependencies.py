from typing import List, Optional
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User, UserRole

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise UnauthorizedException("Authentication token was not provided")
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired authentication token")
    
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise UnauthorizedException("Token payload missing user identifier")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise UnauthorizedException("User account no longer exists")
    if not user.is_active:
        raise ForbiddenException("User account is deactivated")
    
    return user

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        return None
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        return None
    return user


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Access forbidden: User role '{current_user.role}' lacks required permissions ({', '.join(allowed_roles)})"
            )
        return current_user
    return role_checker

def require_collector(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.COLLECTOR.value:
        raise ForbiddenException("This endpoint is strictly reserved for verified collectors")
    return current_user

def require_recycler(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.RECYCLER.value:
        raise ForbiddenException("This endpoint is strictly reserved for authorized recyclers")
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN.value:
        raise ForbiddenException("Administrative privileges required")
    return current_user
