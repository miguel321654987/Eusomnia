from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select

from api.extensions import db
from api.blueprints.user_bp import user_bp
from api.blueprints.daily_entries_bp import daily_entries_bp
from api.blueprints.daily_entries_bp.models import DailyEntry
from api.blueprints.nutrition_bp import nutrition_bp
from api.blueprints.analysis_bp import analysis_bp

api = Blueprint('api', __name__)

# Registro modular con sus prefijos de URL correspondientes:
api.register_blueprint(user_bp, url_prefix='/users')           # /api/users/...
# /api/entries/...
api.register_blueprint(daily_entries_bp, url_prefix='/entries')
# /api/nutrition/...
api.register_blueprint(nutrition_bp, url_prefix='/nutrition')
# /api/analysis/...
api.register_blueprint(analysis_bp, url_prefix='/analysis')


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
