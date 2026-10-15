from datetime import datetime
from sqlalchemy import Integer, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db


class NutritionLog(db.Model):
    """Nutritional analysis log per daily entry"""
    __tablename__ = "nutrition_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey(
        "daily_entries.id"), unique=True, nullable=False)
    calories: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    caffeine_mg: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    sugar_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    sodium_mg: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    raw_response: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False)

    daily_entry: Mapped["DailyEntry"] = relationship(
        "DailyEntry", back_populates="nutrition_log")

    def serialize(self):
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "calories": self.calories,
            "caffeine_mg": self.caffeine_mg,
            "sugar_g": self.sugar_g,
            "sodium_mg": self.sodium_mg,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
