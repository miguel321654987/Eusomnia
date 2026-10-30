import json
from datetime import datetime, date, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, ForeignKey, Text, Date, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db

if TYPE_CHECKING:
    from api.blueprints.analysis_bp.models import SleepAnalysis
    # Import NutritionLog for type checking to resolve forward reference and silence Pylance errors.
    from api.blueprints.nutrition_bp.models import NutritionLog


class DailyEntry(db.Model):
    """Central daily log entry connecting habits, sleep, nutrition and analysis"""
    __tablename__ = "daily_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False)
    entry_date: Mapped[date] = mapped_column(
        Date, default=date.today, nullable=False)
    original_entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    # Use timezone‑aware UTC timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    sleep_report: Mapped["SleepReport"] = relationship(
        "SleepReport", back_populates="daily_entry", uselist=False, cascade="all, delete-orphan"
    )
    habit_log: Mapped["HabitLog"] = relationship(
        "HabitLog", back_populates="daily_entry", uselist=False, cascade="all, delete-orphan"
    )
    nutrition_log: Mapped["NutritionLog"] = relationship(
        "NutritionLog", back_populates="daily_entry", uselist=False, cascade="all, delete-orphan"
    )
    analysis: Mapped["SleepAnalysis"] = relationship(
        "SleepAnalysis", back_populates="daily_entry", uselist=False, cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "entry_date": self.entry_date.isoformat() if self.entry_date else None,
            "original_entry_date": (
                self.original_entry_date.isoformat()
                if self.original_entry_date
                else None
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "sleep_report": self.sleep_report.serialize() if self.sleep_report else None,
            "habit_log": self.habit_log.serialize() if self.habit_log else None,
            "nutrition_log": self.nutrition_log.serialize() if self.nutrition_log else None,
            "analysis": self.analysis.serialize() if self.analysis else None
        }

    # ---------------------------------------------------------------------
    # Custom constructor
    # ---------------------------------------------------------------------
    def __init__(
        self,
        user_id: int,
        entry_date: date | None = None,
        original_entry_date: date | None = None,
        **kwargs,
    ):
        """Create a ``DailyEntry`` ensuring type‑checked arguments.

        SQLAlchemy's ``Model`` constructor accepts arbitrary keyword arguments
        corresponding to mapped columns, but its type hints do not expose those
        names. Static analysers therefore report *"No parameter named …"* when
        we pass column names (e.g. ``entry_date``) to ``super().__init__``.

        To keep type‑checkers happy we delegate only the generic ``**kwargs``
        to the parent constructor and assign ``entry_date`` (and ``user_id``)
        explicitly on ``self``. This satisfies Pylance while preserving the
        normal SQLAlchemy behaviour.

        Args:
            user_id: Identifier of the user that owns the entry.
            entry_date: Current entry date; defaults to ``date.today()``.
            original_entry_date: Immutable initial entry date; defaults to
                ``entry_date``.
            **kwargs: Additional attributes that may be added later.
        """
        # Initialise the base model without column‑specific arguments.
        super().__init__(**kwargs)
        # Explicitly set known columns.
        self.user_id = user_id
        current_entry_date = entry_date or date.today()
        self.entry_date = current_entry_date
        self.original_entry_date = original_entry_date or current_entry_date


class SleepReport(db.Model):
    """Sleep narrative and transcription report"""
    __tablename__ = "sleep_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey(
        "daily_entries.id"), unique=True, nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    final_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False)

    daily_entry: Mapped["DailyEntry"] = relationship(
        "DailyEntry", back_populates="sleep_report")

    # ---------------------------------------------------------------------
    # Custom constructor
    # ---------------------------------------------------------------------
    def __init__(
        self,
        entry_id: int,
        raw_text: str,
        final_text: str | None = None,
        audio_url: str | None = None,
        **kwargs,
    ):
        # Delegate generic kwargs to the base model.
        super().__init__(**kwargs)
        # Explicitly set known columns to keep static analysers happy.
        self.entry_id = entry_id
        self.raw_text = raw_text
        self.final_text = final_text
        self.audio_url = audio_url


    def serialize(self):
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "raw_text": self.raw_text,
            "final_text": self.final_text or self.raw_text,
            "audio_url": self.audio_url,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class HabitLog(db.Model):
    """Daily habits and sleep hygiene factors"""
    __tablename__ = "habit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey(
        "daily_entries.id"), unique=True, nullable=False)
    physical_activity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dinner_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bedtime_mood: Mapped[str | None] = mapped_column(String(50), nullable=True)
    screen_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    incidents: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emotional_state: Mapped[str | None] = mapped_column(String(255), nullable=True)
    food_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    meal_entries: Mapped[str | None] = mapped_column(Text, nullable=True)
    sleep_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_quality: Mapped[str | None] = mapped_column(String(50), nullable=True)

    daily_entry: Mapped["DailyEntry"] = relationship(
        "DailyEntry", back_populates="habit_log")

    # ---------------------------------------------------------------------
    # Custom constructor
    # ---------------------------------------------------------------------
    def __init__(
        self,
        entry_id: int,
        physical_activity: str | None = None,
        dinner_type: str | None = None,
        bedtime_mood: str | None = None,
        screen_time: str | None = None,
        incidents: str | None = None,
        emotional_state: str | None = None,
        food_notes: str | None = None,
        meal_entries: str | None = None,
        sleep_context: str | None = None,
        total_sleep_hours: float | None = None,
        sleep_quality: str | None = None,
        **kwargs,
    ):
        # Delegate generic kwargs to the base model.
        super().__init__(**kwargs)
        # Explicitly set known columns to keep static analysers happy.
        self.entry_id = entry_id
        self.physical_activity = physical_activity
        self.dinner_type = dinner_type
        self.bedtime_mood = bedtime_mood
        self.screen_time = screen_time
        self.incidents = incidents
        self.emotional_state = emotional_state
        self.food_notes = food_notes
        self.meal_entries = meal_entries
        self.sleep_context = sleep_context
        self.total_sleep_hours = total_sleep_hours
        self.sleep_quality = sleep_quality


    def serialize(self):
        try:
            meal_entries = json.loads(self.meal_entries or "{}")
        except json.JSONDecodeError:
            meal_entries = {}
        try:
            sleep_context = json.loads(self.sleep_context or "{}")
        except json.JSONDecodeError:
            sleep_context = {}
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "physical_activity": self.physical_activity,
            "dinner_type": self.dinner_type,
            "bedtime_mood": self.bedtime_mood,
            "screen_time": self.screen_time,
            "incidents": self.incidents,
            "emotional_state": self.emotional_state,
            "food_notes": self.food_notes,
            "meal_entries": meal_entries,
            "sleep_context": sleep_context,
            "total_sleep_hours": self.total_sleep_hours,
            "sleep_quality": self.sleep_quality
        }
