import io
from typing import Tuple, Optional, Dict, Any
from PIL import Image

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MIN_FILE_SIZE = 16  # Bytes

class ImageValidationError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": False,
            "error": {
                "code": self.code,
                "message": self.message
            }
        }

class ImageValidator:
    """
    Validates uploaded images for the RECYCLINK AI Intelligence Engine.
    Ensures format integrity, size constraints, and image decodability.
    """

    @classmethod
    def validate(
        cls,
        image_bytes: bytes,
        filename: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> Tuple[bool, Optional[Image.Image]]:
        """
        Validates raw image bytes and returns decoded PIL Image if valid.
        Raises ImageValidationError on invalid input.
        """
        if not image_bytes or len(image_bytes) < MIN_FILE_SIZE:
            raise ImageValidationError(
                code="EMPTY_IMAGE",
                message="Uploaded image file is empty or corrupted."
            )

        if len(image_bytes) > MAX_FILE_SIZE:
            raise ImageValidationError(
                code="FILE_TOO_LARGE",
                message="Image file exceeds maximum allowable size of 10 MB."
            )

        # Check filename extension if provided
        if filename:
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            if ext and ext not in ALLOWED_EXTENSIONS:
                raise ImageValidationError(
                    code="UNSUPPORTED_FORMAT",
                    message=f"Unsupported format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
                )

        # Check MIME type if provided
        if content_type and content_type.lower() not in ALLOWED_MIME_TYPES and content_type != "application/octet-stream":
            raise ImageValidationError(
                code="UNSUPPORTED_FORMAT",
                message=f"Unsupported media type '{content_type}'. Allowed types: image/jpeg, image/png, image/webp."
            )

        # Validate with PIL decodability
        try:
            pil_image = Image.open(io.BytesIO(image_bytes))
            # Verify internal image structure
            pil_image.verify()

            # Reopen because verify() consumes image state
            pil_image = Image.open(io.BytesIO(image_bytes))
            pil_image.load()

            # Normalize image mode
            if pil_image.mode not in ("RGB", "RGBA", "L"):
                pil_image = pil_image.convert("RGB")

            return True, pil_image
        except Exception as e:
            raise ImageValidationError(
                code="INVALID_IMAGE",
                message="Please upload a valid e-waste image. File could not be decoded."
            )

    @classmethod
    def preprocess(cls, pil_image: Image.Image, max_dim: int = 1024) -> Image.Image:
        """
        Preprocesses image: resizes to max dimension while preserving aspect ratio,
        and converts to RGB.
        """
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")

        w, h = pil_image.size
        if max(w, h) > max_dim:
            scale = max_dim / float(max(w, h))
            new_size = (int(w * scale), int(h * scale))
            pil_image = pil_image.resize(new_size, Image.Resampling.LANCZOS)

        return pil_image
