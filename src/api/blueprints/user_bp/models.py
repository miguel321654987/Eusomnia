from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db

if TYPE_CHECKING:
    from api.blueprints.daily_entries_bp.models import DailyEntry


class User(db.Model):
    """User account model"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(250), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chronotype: Mapped[str | None] = mapped_column(String(20), nullable=True)

    def __init__(
        self,
        email: str,
        password: str,
        name: str,
        last_name: str,
        is_active: bool = True,
        birth_year: int | None = None,
        chronotype: str | None = None,
    ) -> None:
        """Explicit constructor so static type checkers recognize keyword args."""
        self.email = email
        self.password = password
        self.name = name
        self.last_name = last_name
        self.is_active = is_active
        self.birth_year = birth_year
        self.chronotype = chronotype

    preferences: Mapped["UserPreferences"] = relationship(
        "UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    daily_entries: Mapped[list["DailyEntry"]] = relationship(
        "DailyEntry", cascade="all, delete-orphan"
    )

    def serialize(self):
        """Serialize user object"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "last_name": self.last_name,
            "is_active": self.is_active,
            "birth_year": self.birth_year,
            "chronotype": self.chronotype,
        }


class UserPreferences(db.Model):
    """User preferences for AI and app behavior"""
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    ai_provider: Mapped[str] = mapped_column(String(50), default="openrouter", nullable=False)
    custom_api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    selected_model: Mapped[str] = mapped_column(
        String(100), default="nvidia/nemotron-3.5-super-vl:free", nullable=False
    )
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    interpretation_framework: Mapped[str] = mapped_column(
        String(30),
        default="jungian",
        server_default=text("'jungian'"),
        nullable=False,
    )
    report_depth: Mapped[str] = mapped_column(
        String(30),
        default="standard",
        server_default=text("'standard'"),
        nullable=False,
    )
    include_nutrition_in_analysis: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )
    morning_reminder_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )
    morning_reminder_time: Mapped[str] = mapped_column(
        String(5),
        default="07:30",
        server_default=text("'07:30'"),
        nullable=False,
    )
    caffeine_reminder_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )
    caffeine_reminder_time: Mapped[str] = mapped_column(
        String(5),
        default="18:00",
        server_default=text("'18:00'"),
        nullable=False,
    )
    winddown_reminder_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )
    winddown_reminder_time: Mapped[str] = mapped_column(
        String(5),
        default="22:30",
        server_default=text("'22:30'"),
        nullable=False,
    )

    def __init__(
        self,
        user_id: int,
        ai_provider: str = "openrouter",
        custom_api_key: str | None = None,
        selected_model: str = "nvidia/nemotron-3.5-super-vl:free",
        timezone: str = "UTC",
        interpretation_framework: str = "jungian",
        report_depth: str = "standard",
        include_nutrition_in_analysis: bool = True,
        morning_reminder_enabled: bool = True,
        morning_reminder_time: str = "07:30",
        caffeine_reminder_enabled: bool = True,
        caffeine_reminder_time: str = "18:00",
        winddown_reminder_enabled: bool = True,
        winddown_reminder_time: str = "22:30",
    ) -> None:
        """Explicit constructor so static type checkers recognize keyword args."""
        self.user_id = user_id
        self.ai_provider = ai_provider
        self.custom_api_key = custom_api_key
        self.selected_model = selected_model
        self.timezone = timezone
        self.interpretation_framework = interpretation_framework
        self.report_depth = report_depth
        self.include_nutrition_in_analysis = include_nutrition_in_analysis
        self.morning_reminder_enabled = morning_reminder_enabled
        self.morning_reminder_time = morning_reminder_time
        self.caffeine_reminder_enabled = caffeine_reminder_enabled
        self.caffeine_reminder_time = caffeine_reminder_time
        self.winddown_reminder_enabled = winddown_reminder_enabled
        self.winddown_reminder_time = winddown_reminder_time

    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def serialize(self):
        """Serialize preferences object"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "ai_provider": self.ai_provider,
            "selected_model": self.selected_model,
            "timezone": self.timezone,
            "has_custom_key": bool(self.custom_api_key),
            "interpretation_framework": self.interpretation_framework,
            "report_depth": self.report_depth,
            "include_nutrition_in_analysis": self.include_nutrition_in_analysis,
            "morning_reminder_enabled": self.morning_reminder_enabled,
            "morning_reminder_time": self.morning_reminder_time,
            "caffeine_reminder_enabled": self.caffeine_reminder_enabled,
            "caffeine_reminder_time": self.caffeine_reminder_time,
            "winddown_reminder_enabled": self.winddown_reminder_enabled,
            "winddown_reminder_time": self.winddown_reminder_time,
        }
