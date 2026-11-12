from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.extensions import db


class User(db.Model):
    """User account model"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(250), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)

    preferences: Mapped["UserPreferences"] = relationship(
        "UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def serialize(self):
        """Serialize user object"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "last_name": self.last_name,
            "is_active": self.is_active
        }


class UserPreferences(db.Model):
    """User preferences for AI and app behavior"""
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    ai_provider: Mapped[str] = mapped_column(String(50), default="openrouter", nullable=False)
    custom_api_key: Mapped[str] = mapped_column(String(255), nullable=True)
    selected_model: Mapped[str] = mapped_column(
        String(100), default="meta-llama/llama-3.3-70b-instruct:free", nullable=False
    )
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def serialize(self):
        """Serialize preferences object"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "ai_provider": self.ai_provider,
            "selected_model": self.selected_model,
            "timezone": self.timezone,
            "has_custom_key": bool(self.custom_api_key)
        }
