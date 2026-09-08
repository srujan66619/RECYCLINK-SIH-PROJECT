import base64
from typing import Optional, List
from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_optional_current_user, require_admin
from app.models.user import User
from app.ai.service import ai_service_engine
from app.ai.image_validator import ImageValidationError
from app.ai.schemas import (
    MaterialClassifyResponse,
    ValueEstimateRequest,
    ValueEstimateResponse,
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    ManualClassificationRequest,
    AIAnalyticsResponse,
)

router = APIRouter(prefix="/api/ai", tags=["AI Material Intelligence"])

@router.post("/classify-material", response_model=MaterialClassifyResponse)
async def classify_material(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Classify e-waste material using modular AI vision pipeline.
    Accepts:
    1. Multipart/form-data: image file upload (JPG, PNG, WEBP) + optional lot_id, weight, sample_key
    2. Application/json: sample_key, image_base64, lot_id, weight
    """
    content_type = request.headers.get("content-type", "")

    image_bytes = None
    filename = None
    file_content_type = None
    sample_key = None
    lot_id = None
    user_weight = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        image_val = form.get("image")
        if image_val and hasattr(image_val, "read"):
            image_bytes = await image_val.read()
            filename = getattr(image_val, "filename", None)
            file_content_type = getattr(image_val, "content_type", None)
        sample_key = form.get("sample_key")
        lot_id = form.get("lot_id")
        user_weight = form.get("weight")
    else:
        try:
            body = await request.json()
        except Exception:
            body = {}
        sample_key = body.get("sample_key")
        lot_id = body.get("lot_id")
        user_weight = body.get("weight")
        image_base64 = body.get("image_base64")

        if image_base64:
            if "," in image_base64:
                header, b64data = image_base64.split(",", 1)
                if "image/png" in header:
                    file_content_type = "image/png"
                    filename = "upload.png"
                elif "image/webp" in header:
                    file_content_type = "image/webp"
                    filename = "upload.webp"
                else:
                    file_content_type = "image/jpeg"
                    filename = "upload.jpg"
            else:
                b64data = image_base64
                filename = "upload.jpg"
                file_content_type = "image/jpeg"

            try:
                image_bytes = base64.b64decode(b64data)
            except Exception:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": {
                            "code": "INVALID_IMAGE",
                            "message": "Please upload a valid e-waste image."
                        }
                    }
                )

    if lot_id is not None:
        try:
            lot_id = int(lot_id)
        except (ValueError, TypeError):
            lot_id = None

    if user_weight is not None:
        try:
            user_weight = float(user_weight)
        except (ValueError, TypeError):
            user_weight = None

    try:
        result = ai_service_engine.classify_material(
            image_bytes=image_bytes,
            filename=filename,
            content_type=file_content_type,
            sample_key=sample_key,
            user_weight=user_weight,
            lot_id=lot_id,
            db=db
        )
        return MaterialClassifyResponse(**result)
    except ImageValidationError as e:
        return JSONResponse(status_code=e.status_code, content=e.to_dict())

@router.post("/manual-material", response_model=MaterialClassifyResponse)
def record_manual_material(
    req: ManualClassificationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Collector manual material selection fallback when AI is bypassed or confidence is low.
    """
    result = ai_service_engine.record_manual_selection(
        material_category=req.material_category,
        weight=req.weight,
        lot_id=req.lot_id,
        notes=req.notes,
        db=db
    )
    return MaterialClassifyResponse(**result)

@router.post("/estimate-value", response_model=ValueEstimateResponse)
def estimate_material_value(
    req: ValueEstimateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Transparent, deterministic AI price estimation foundation based on material
    baseline, condition, and weight.
    """
    mat_name = req.material_name or "PCB"
    result = ai_service_engine.estimate_value(
        material_name=mat_name,
        weight=req.weight,
        condition=req.condition,
        location_id=req.location_id
    )
    return ValueEstimateResponse(**result)

@router.post("/detect-anomaly", response_model=AnomalyDetectionResponse)
def detect_transaction_anomaly(
    req: AnomalyDetectionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Transaction guardian detecting predatory underpricing (>30-40% below benchmark)
    and anomalous price inflations.
    """
    result = ai_service_engine.detect_anomaly(
        expected_price=req.expected_price,
        offered_price=req.offered_price,
        material_name=req.material_name,
        weight=req.weight,
        transaction_id=req.transaction_id,
        lot_id=req.lot_id,
        db=db
    )
    return AnomalyDetectionResponse(**result)

@router.get("/analytics", response_model=AIAnalyticsResponse)
def get_ai_analytics(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    AI operational performance and prediction metrics.
    """
    metrics = ai_service_engine.get_analytics(db=db)
    return AIAnalyticsResponse(**metrics)
