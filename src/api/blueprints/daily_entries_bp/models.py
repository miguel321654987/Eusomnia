from datetime import datetime, date
from sqlalchemy import String, Integer, ForeignKey, Text, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db


class DailyEntry(db.Model):
    """Central daily log entry connecting habits, sleep, nutrition and analysis"""
    __tablename__ = "daily_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False)
    entry_date: Mapped[date] = mapped_column(
        Date, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

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
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "sleep_report": self.sleep_report.serialize() if self.sleep_report else None,
            "habit_log": self.habit_log.serialize() if self.habit_log else None,
            "nutrition_log": self.nutrition_log.serialize() if self.nutrition_log else None,
            "analysis": self.analysis.serialize() if self.analysis else None
        }


class SleepReport(db.Model):
    """Sleep narrative and transcription report"""
    __tablename__ = "sleep_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey(
        "daily_entries.id"), unique=True, nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    final_text: Mapped[str] = mapped_column(Text, nullable=True)
    audio_url: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False)

    daily_entry: Mapped["DailyEntry"] = relationship(
        "DailyEntry", back_populates="sleep_report")

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
    physical_activity: Mapped[str] = mapped_column(String(50), nullable=True)
    dinner_type: Mapped[str] = mapped_column(String(50), nullable=True)
    bedtime_mood: Mapped[str] = mapped_column(String(50), nullable=True)
    screen_time: Mapped[str] = mapped_column(String(50), nullable=True)
    incidents: Mapped[str] = mapped_column(String(255), nullable=True)
    food_notes: Mapped[str] = mapped_column(Text, nullable=True)

    daily_entry: Mapped["DailyEntry"] = relationship(
        "DailyEntry", back_populates="habit_log")

    def serialize(self):
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "physical_activity": self.physical_activity,
            "dinner_type": self.dinner_type,
            "bedtime_mood": self.bedtime_mood,
            "screen_time": self.screen_time,
            "incidents": self.incidents,
            "food_notes": self.food_notes
        }
