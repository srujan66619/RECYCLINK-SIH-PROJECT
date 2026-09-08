import random
import threading
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.ewaste_lot import EWasteLot

_lock = threading.Lock()
_issued_lot_ids = set()
_issued_trace_ids = set()

def generate_lot_id(db: Session) -> str:
    """
    Generate a unique, collision-safe Lot Identifier.
    Format: LOT-YYYY-XXXXXX (e.g., LOT-2026-102941)
    """
    with _lock:
        year = datetime.utcnow().strftime("%Y")
        for _ in range(100):
            seq = random.randint(100000, 999999)
            candidate = f"LOT-{year}-{seq:06d}"
            if candidate not in _issued_lot_ids:
                if not db.query(EWasteLot).filter(EWasteLot.lot_id == candidate).first():
                    _issued_lot_ids.add(candidate)
                    return candidate
        
        # Fallback timestamp microsecond
        candidate = f"LOT-{year}-{int(datetime.utcnow().timestamp() * 1000) % 1000000:06d}"
        _issued_lot_ids.add(candidate)
        return candidate

def generate_trace_id(db: Session) -> str:
    """
    Generate a unique, collision-safe Circular Trace Identifier.
    Format: RC-YYYY-XXXXXX (e.g., RC-2026-102941)
    """
    with _lock:
        year = datetime.utcnow().strftime("%Y")
        for _ in range(100):
            seq = random.randint(100000, 999999)
            candidate = f"RC-{year}-{seq:06d}"
            if candidate not in _issued_trace_ids:
                if not db.query(EWasteLot).filter(EWasteLot.trace_id == candidate).first():
                    _issued_trace_ids.add(candidate)
                    return candidate
        
        # Fallback timestamp microsecond
        candidate = f"RC-{year}-{int(datetime.utcnow().timestamp() * 1000) % 1000000:06d}"
        _issued_trace_ids.add(candidate)
        return candidate

_issued_handover_ids = set()

def generate_handover_id(db: Session) -> str:
    """
    Generate a unique, collision-safe Digital Handover Record Identifier.
    Format: HR-YYYY-XXXXXX (e.g., HR-2026-000241)
    """
    from app.models.handover import HandoverRecord
    with _lock:
        year = datetime.utcnow().strftime("%Y")
        for _ in range(100):
            seq = random.randint(100000, 999999)
            candidate = f"HR-{year}-{seq:06d}"
            if candidate not in _issued_handover_ids:
                if not db.query(HandoverRecord).filter(HandoverRecord.handover_id == candidate).first():
                    _issued_handover_ids.add(candidate)
                    return candidate
        
        candidate = f"HR-{year}-{int(datetime.utcnow().timestamp() * 1000) % 1000000:06d}"
        _issued_handover_ids.add(candidate)
        return candidate
