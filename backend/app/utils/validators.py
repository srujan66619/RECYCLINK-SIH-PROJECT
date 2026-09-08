import re
from app.core.exceptions import AppException

def validate_phone(phone: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", phone)
    if len(cleaned) < 10 or len(cleaned) > 15:
        raise AppException("INVALID_PHONE", "Phone number must be between 10 and 15 digits.")
    return cleaned

def validate_positive_float(val: float, field_name: str) -> float:
    if val <= 0:
        raise AppException("INVALID_INPUT", f"{field_name} must be greater than zero.")
    return val
