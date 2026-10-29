from datetime import datetime, timezone
from sqlalchemy import Boolean, Integer, Float, ForeignKey, Text, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db
from typing import TYPE_CHECKING

# Import DailyEntry only for type checking to avoid circular import issues at runtime.
if TYPE_CHECKING:
    from api.blueprints.daily_entries_bp.models import DailyEntry


class NutritionLog(db.Model):
    """Nutritional analysis log per daily entry"""
    __tablename__ = "nutrition_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey(
        "daily_entries.id"), unique=True, nullable=False)
    calories: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    carbohydrates_g: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    sugar_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    fat_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    caffeine_mg: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    alcohol_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    omega3_mg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    sodium_mg: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    vitamin_e_mg: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    vitamin_b12_ug: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    total_weight_g: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False)
    meal_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    other_excitants_present: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    raw_response: Mapped[str] = mapped_column(Text, nullable=True)
    # Use timezone‑aware UTC datetime
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    daily_entry: Mapped["DailyEntry"] = relationship(
        "DailyEntry", back_populates="nutrition_log")

    def serialize(self):
        has_nutrition_values = any(
            value is not None and value > 0
            for value in (
                self.calories,
                self.protein_g,
                self.carbohydrates_g,
                self.sugar_g,
                self.fat_g,
                self.sodium_mg,
                self.caffeine_mg,
                self.alcohol_g,
                self.omega3_mg,
                self.vitamin_e_mg,
                self.vitamin_b12_ug,
                self.total_weight_g,
            )
        )
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "calories": self.calories,
            "protein_g": self.protein_g,
            "carbohydrates_g": self.carbohydrates_g,
            "sugar_g": self.sugar_g,
            "fat_g": self.fat_g,
            "caffeine_mg": self.caffeine_mg,
            "alcohol_g": self.alcohol_g,
            "omega3_mg": self.omega3_mg,
            "sodium_mg": self.sodium_mg,
            "vitamin_e_mg": self.vitamin_e_mg,
            "vitamin_b12_ug": self.vitamin_b12_ug,
            "total_weight_g": self.total_weight_g,
            "meal_type": self.meal_type,
            "other_excitants_present": self.other_excitants_present,
            "analyzed": bool(self.raw_response) and has_nutrition_values,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
