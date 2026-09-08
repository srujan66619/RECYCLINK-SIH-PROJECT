import io
import base64
import urllib.parse

def generate_qr_data_url(trace_id: str, client_base_url: str = "http://localhost:5173") -> str:
    """
    Generate QR code image data URL for a given Trace ID.
    If qrcode/PIL are available, encodes a crisp PNG.
    Fallback generates standard SVG QR or external SVG link.
    """
    trace_url = f"{client_base_url}/trace/{trace_id}"
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        qr.add_data(trace_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0F5132", back_color="#FFFFFF")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"
    except Exception:
        # Fallback to an encoded SVG QR pattern or placeholder URL
        encoded_url = urllib.parse.quote(trace_url)
        return f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={encoded_url}&color=0F5132"
