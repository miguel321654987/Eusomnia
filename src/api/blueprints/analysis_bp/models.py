from datetime import datetime
import json
from sqlalchemy import String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db


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
    predominant_emotions: Mapped[str] = mapped_column(Text, nullable=True)
    detected_symbols: Mapped[str] = mapped_column(Text, nullable=True)
    habits_reading: Mapped[str] = mapped_column(Text, nullable=True)
    patterns_detected: Mapped[str] = mapped_column(Text, nullable=True)
    recommendations: Mapped[str] = mapped_column(Text, nullable=True)
    alerts: Mapped[str] = mapped_column(Text, nullable=True)
    raw_json_response: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    daily_entry: Mapped["DailyEntry"] = relationship("DailyEntry", back_populates="analysis")

    def serialize(self):
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "interpretation": self.interpretation,
            "predominant_emotions": json.loads(self.predominant_emotions or "[]"),
            "detected_symbols": json.loads(self.detected_symbols or "[]"),
            "habits_reading": self.habits_reading,
            "patterns_detected": self.patterns_detected,
            "recommendations": json.loads(self.recommendations or "[]"),
            "alerts": json.loads(self.alerts or "[]"),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
