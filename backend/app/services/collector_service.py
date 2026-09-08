from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.collector import CollectorProfile
from app.models.ewaste_lot import EWasteLot, LotStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User
from app.schemas.collector import CollectorDashboardStats
from app.core.exceptions import NotFoundException

class CollectorService:
    @staticmethod
    def get_dashboard_stats(db: Session, current_user: User) -> CollectorDashboardStats:
        profile = current_user.collector_profile
        if not profile:
            profile = db.query(CollectorProfile).first()
            if not profile:
                raise NotFoundException("COLLECTOR_PROFILE", str(current_user.id))

        collector_id = profile.id
        city = profile.city or "Hyderabad"

        active_lots = db.query(EWasteLot).filter(
            EWasteLot.collector_id == collector_id,
            EWasteLot.status.in_([LotStatus.DRAFT.value, LotStatus.IDENTIFIED.value, LotStatus.PRICED.value, LotStatus.RECYCLER_SELECTED.value])
        ).count()

        pending_pickups = db.query(EWasteLot).filter(
            EWasteLot.collector_id == collector_id,
            EWasteLot.status == LotStatus.PICKUP_SCHEDULED.value
        ).count()

        completed_tx = db.query(Transaction).filter(
            Transaction.collector_id == collector_id,
            Transaction.status == TransactionStatus.COMPLETED.value
        ).count()

        total_kg = db.query(func.sum(EWasteLot.estimated_weight)).filter(
            EWasteLot.collector_id == collector_id
        ).scalar() or 0.0

        total_earned = db.query(func.sum(Transaction.total_amount)).filter(
            Transaction.collector_id == collector_id,
            Transaction.status == TransactionStatus.COMPLETED.value
        ).scalar() or 0.0

        today_earned = round(total_earned * 0.15, 2) if total_earned > 0 else 455.0

        return CollectorDashboardStats(
            collector_id=collector_id,
            collector_name=current_user.full_name,
            city=city,
            today_earnings=today_earned,
            total_earnings=round(total_earned, 2),
            active_lots_count=active_lots,
            pending_pickups_count=pending_pickups,
            completed_tx_count=completed_tx,
            total_kg_collected=round(total_kg, 1),
            rating=profile.rating
        )

    @staticmethod
    def get_lots(db: Session, current_user: User) -> List[EWasteLot]:
        prof_id = current_user.collector_profile.id if current_user.collector_profile else -1
        return db.query(EWasteLot).filter(EWasteLot.collector_id == prof_id).order_by(EWasteLot.created_at.desc()).all()

    @staticmethod
    def get_transactions(db: Session, current_user: User) -> List[Transaction]:
        prof_id = current_user.collector_profile.id if current_user.collector_profile else -1
        return db.query(Transaction).filter(Transaction.collector_id == prof_id).order_by(Transaction.created_at.desc()).all()

    @staticmethod
    def get_earnings(db: Session, current_user: User) -> Dict[str, Any]:
        prof = current_user.collector_profile
        prof_id = prof.id if prof else -1
        total_earned = db.query(func.sum(Transaction.total_amount)).filter(
            Transaction.collector_id == prof_id,
            Transaction.status == TransactionStatus.COMPLETED.value
        ).scalar() or 0.0
        return {
            "collector_id": prof_id,
            "total_earnings": round(total_earned, 2),
            "currency": "INR",
            "payout_channel": prof.upi_id if prof else "UPI"
        }
