from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db
from api.blueprints.daily_entries_bp.models import DailyEntry


class DreamConcept(db.Model):
    """Catalog of dream concepts identified via vector search"""
    __tablename__ = "dream_concepts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "summary": self.summary,
            "category": self.category
        }


class SleepAnalysis(db.Model):
    """Unified AI analysis combining sleep, habits and nutrition"""
    __tablename__ = "sleep_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("daily_entries.id"), unique=True, nullable=False)
    interpretation: Mapped[str] = mapped_column(Text, nullable=False)
    predominant_emotions: Mapped[str | None] = mapped_column(String(255), nullable=True)
    detected_symbols: Mapped[str | None] = mapped_column(String(255), nullable=True)
    habits_reading: Mapped[str | None] = mapped_column(Text, nullable=True)
    patterns_detected: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
    alerts: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_json_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    def __init__(
        self,
        entry_id: int,
        interpretation: str,
        predominant_emotions: str | None = None,
        detected_symbols: str | None = None,
        habits_reading: str | None = None,
        patterns_detected: str | None = None,
        recommendations: str | None = None,
        alerts: str | None = None,
        raw_json_response: str | None = None,
        created_at: datetime | None = None,
    ) -> None:
        """Explicit constructor so static type checkers recognize keyword args."""
        self.entry_id = entry_id
        self.interpretation = interpretation
        self.predominant_emotions = predominant_emotions
        self.detected_symbols = detected_symbols
        self.habits_reading = habits_reading
        self.patterns_detected = patterns_detected
        self.recommendations = recommendations
        self.alerts = alerts
        self.raw_json_response = raw_json_response
        if created_at is not None:
            self.created_at = created_at

    daily_entry: Mapped["DailyEntry"] = relationship("DailyEntry", back_populates="analysis")

    def serialize(self):
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "interpretation": self.interpretation,
            "predominant_emotions": self.predominant_emotions,
            "detected_symbols": self.detected_symbols,
            "habits_reading": self.habits_reading,
            "patterns_detected": self.patterns_detected,
            "recommendations": self.recommendations,
            "alerts": self.alerts,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

