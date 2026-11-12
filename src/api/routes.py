from datetime import date, timedelta

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from api.extensions import db
from api.blueprints.user_bp import user_bp
from api.blueprints.daily_entries_bp import daily_entries_bp
from api.blueprints.daily_entries_bp.models import DailyEntry
from api.blueprints.analysis_bp.models import SleepAnalysis
from api.blueprints.nutrition_bp import nutrition_bp
from api.blueprints.analysis_bp import analysis_bp
from api.blueprints.exports_bp import exports_bp

api = Blueprint('api', __name__)

# Registro modular con sus prefijos de URL correspondientes:
api.register_blueprint(user_bp, url_prefix='/users')           # /api/users/...
# /api/entries/...
api.register_blueprint(daily_entries_bp, url_prefix='/entries')
# /api/nutrition/...
api.register_blueprint(nutrition_bp, url_prefix='/nutrition')
# /api/analysis/...
api.register_blueprint(analysis_bp, url_prefix='/analysis')
# /api/exports/...
api.register_blueprint(exports_bp, url_prefix='/exports')


@api.route("/recent-logs", methods=["GET"])
@jwt_required()
def get_recent_logs():
    """Return the most recent daily entries as JSON for the home page.

    The frontend only needs a stable ``logs`` array (with ``id``, ``title`` and
    ``date`` keys) even when the user has no entries yet, so the endpoint always
    answers with JSON instead of an HTML error page.
    """
    current_user_id = int(get_jwt_identity())
    statement = (
        select(DailyEntry)
        .where(DailyEntry.user_id == current_user_id)
        .order_by(DailyEntry.entry_date.desc())
        .limit(5)
    )
    entries = db.session.scalars(statement).all()

    logs = []
    for entry in entries:
        title = "Daily entry"
        if entry.sleep_report is not None:
            title = (
                entry.sleep_report.final_text
                or entry.sleep_report.raw_text
                or title
            )

        sleep_hours = None
        sleep_quality = None
        if entry.habit_log is not None:
            sleep_hours = entry.habit_log.total_sleep_hours
            sleep_quality = entry.habit_log.sleep_quality

        logs.append(
            {
                "id": entry.id,
                "title": title,
                "date": entry.entry_date.isoformat()
                if entry.entry_date is not None
                else None,
                "sleep_hours": sleep_hours,
                "sleep_quality": sleep_quality,
            }
        )

    return jsonify({"logs": logs}), 200


@api.route("/home-summary", methods=["GET"])
@jwt_required()
def get_home_summary():
    """Return a short, authenticated summary built from saved user entries."""
    current_user_id = int(get_jwt_identity())
    today = date.today()
    current_start = today - timedelta(days=6)
    previous_start = today - timedelta(days=13)

    recent_entries = db.session.scalars(
        select(DailyEntry)
        .where(DailyEntry.user_id == current_user_id)
        .options(
            selectinload(DailyEntry.sleep_report),
            selectinload(DailyEntry.habit_log),
            selectinload(DailyEntry.analysis),
        )
        .order_by(DailyEntry.entry_date.desc(), DailyEntry.created_at.desc())
        .limit(5)
    ).all()
    period_entries = db.session.scalars(
        select(DailyEntry)
        .where(
            DailyEntry.user_id == current_user_id,
            DailyEntry.entry_date >= previous_start,
            DailyEntry.entry_date <= today,
        )
        .options(
            selectinload(DailyEntry.sleep_report),
            selectinload(DailyEntry.habit_log),
            selectinload(DailyEntry.analysis),
        )
        .order_by(DailyEntry.entry_date.desc(), DailyEntry.created_at.desc())
    ).all()
    pending_count = db.session.scalar(
        select(func.count(DailyEntry.id))
        .outerjoin(SleepAnalysis, SleepAnalysis.entry_id == DailyEntry.id)
        .where(
            DailyEntry.user_id == current_user_id,
            SleepAnalysis.id.is_(None),
        )
    ) or 0

    serialized_recent_entries = []
    for entry in recent_entries:
        habit_log = entry.habit_log
        sleep_report = entry.sleep_report
        narrative = (
            (sleep_report.final_text or sleep_report.raw_text)
            if sleep_report
            else ""
        )
        analysis = entry.analysis.serialize() if entry.analysis else None
        serialized_recent_entries.append({
            "id": entry.id,
            "date": entry.entry_date.isoformat() if entry.entry_date else None,
            "title": narrative[:70] or "Registro de descanso",
            "excerpt": narrative,
            "sleep_hours": (
                habit_log.total_sleep_hours if habit_log else None
            ),
            "sleep_quality": (
                habit_log.sleep_quality if habit_log else None
            ),
            "has_analysis": analysis is not None,
            "analysis": analysis,
        })

    current_hours = [
        entry.habit_log.total_sleep_hours
        for entry in period_entries
        if entry.entry_date >= current_start
        and entry.habit_log
        and entry.habit_log.total_sleep_hours is not None
    ]
    previous_hours = [
        entry.habit_log.total_sleep_hours
        for entry in period_entries
        if previous_start <= entry.entry_date < current_start
        and entry.habit_log
        and entry.habit_log.total_sleep_hours is not None
    ]
    current_average = (
        round(sum(current_hours) / len(current_hours), 1)
        if current_hours
        else None
    )
    previous_average = (
        round(sum(previous_hours) / len(previous_hours), 1)
        if previous_hours
        else None
    )
    comparison = None
    if len(current_hours) >= 3 and len(previous_hours) >= 3:
        comparison = round(current_average - previous_average, 1)

    return jsonify({
        "message": "Home summary retrieved successfully",
        "results": {
            "recent_entries": serialized_recent_entries,
            "pending_analysis_count": pending_count,
            "sleep_summary": {
                "current_period_days": 7,
                "current_sample_size": len(current_hours),
                "current_average_hours": current_average,
                "previous_period_days": 7,
                "previous_sample_size": len(previous_hours),
                "previous_average_hours": previous_average,
                "comparison_hours": comparison,
                "comparison_available": comparison is not None,
                "source": "Autodeclarado por el usuario",
            },
        },
    }), 200
