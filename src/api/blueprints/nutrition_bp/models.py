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
    calories: Mapped[float] = mapped_column(Float, nullable=True)
    fats_g: Mapped[float] = mapped_column(Float, nullable=True)
    protein_g: Mapped[float] = mapped_column(Float, nullable=True)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=True)
    caffeine_mg: Mapped[float] = mapped_column(
        Float, nullable=True)
    sugar_g: Mapped[float] = mapped_column(Float, nullable=True)
    sodium_mg: Mapped[float] = mapped_column(
        Float, nullable=True)
    vitamin_b12_mcg: Mapped[float] = mapped_column(Float, nullable=True)
    vitamin_e_mg: Mapped[float] = mapped_column(Float, nullable=True)
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
            "fats_g": self.fats_g,
            "protein_g": self.protein_g,
            "carbs_g": self.carbs_g,
            "caffeine_mg": self.caffeine_mg,
            "sugar_g": self.sugar_g,
            "sodium_mg": self.sodium_mg,
            "vitamin_b12_mcg": self.vitamin_b12_mcg,
            "vitamin_e_mg": self.vitamin_e_mg,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
