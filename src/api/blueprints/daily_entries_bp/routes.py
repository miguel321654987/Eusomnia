from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import select
from datetime import date

from api.extensions import db
from api.utils import APIException
from api.blueprints.daily_entries_bp import daily_entries_bp
from api.blueprints.daily_entries_bp.models import DailyEntry, SleepReport, HabitLog


def _parse_entry_date(value, field_name="date"):
    if not isinstance(value, str):
        raise APIException(f"{field_name} must be an ISO date", status_code=400)

    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise APIException(
            f"{field_name} must be an ISO date",
            status_code=400,
        ) from exc


@daily_entries_bp.route("", methods=["GET"])
@jwt_required()
def get_user_entries():
    current_user_id = int(get_jwt_identity())
    stmt = select(DailyEntry).where(DailyEntry.user_id ==
                                    current_user_id).order_by(
                                        DailyEntry.entry_date.desc(),
                                        DailyEntry.created_at.desc()
                                    )
    entries = db.session.scalars(stmt).all()

    return jsonify({
        "message": "Daily entries retrieved successfully",
        "results": [entry.serialize() for entry in entries]
    }), 200


@daily_entries_bp.route("/<int:entry_id>", methods=["GET"])
@jwt_required()
def get_entry_by_id(entry_id):
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, entry_id)

    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    return jsonify({
        "message": "Daily entry retrieved successfully",
        "results": entry.serialize()
    }), 200


@daily_entries_bp.route("", methods=["POST"])
@jwt_required()
def create_daily_entry():
    current_user_id = int(get_jwt_identity())
    body = request.get_json()
    if body is None:
        raise APIException("JSON body is required", status_code=400)

    sleep_data = body.get("sleep")
    habits_data = body.get("habits", {})

    if not sleep_data or not sleep_data.get("raw_text"):
        raise APIException(
            "Sleep narrative raw_text is required", status_code=400)

    entry_date_raw = body.get("date")
    entry_date = (
        _parse_entry_date(entry_date_raw)
        if entry_date_raw is not None
        else date.today()
    )

    try:
        new_entry = DailyEntry(user_id=current_user_id, entry_date=entry_date)
        db.session.add(new_entry)
        db.session.flush()

        sleep_report = SleepReport(
            entry_id=new_entry.id,
            raw_text=sleep_data.get("raw_text"),
            final_text=sleep_data.get(
                "final_text") or sleep_data.get("raw_text"),
            audio_url=sleep_data.get("audio_url")
        )
        db.session.add(sleep_report)

        total_sleep_hours_raw = habits_data.get("total_sleep_hours")
        try:
            total_sleep_hours = (
                float(total_sleep_hours_raw)
                if total_sleep_hours_raw not in (None, "")
                else None
            )
        except (TypeError, ValueError):
            total_sleep_hours = None

        habit_log = HabitLog(
            entry_id=new_entry.id,
            physical_activity=habits_data.get("physical_activity"),
            dinner_type=habits_data.get("dinner_type"),
            bedtime_mood=habits_data.get("bedtime_mood"),
            screen_time=habits_data.get("screen_time"),
            incidents=habits_data.get("incidents"),
            food_notes=(
                habits_data.get("nutrition_query")
                or habits_data.get("food_notes")
            ),
            total_sleep_hours=total_sleep_hours,
            sleep_quality=habits_data.get("sleep_quality")
        )
        db.session.add(habit_log)

        db.session.commit()

        return jsonify({
            "message": "Daily entry created successfully",
            "results": new_entry.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        raise APIException(
            f"Error creating daily entry: {str(e)}", status_code=500)


@daily_entries_bp.route("/<int:entry_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_daily_entry(entry_id):
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, entry_id)

    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    body = request.get_json()
    if body is None:
        raise APIException("JSON body is required", status_code=400)

    updated_entry_date = None
    if "date" in body:
        updated_entry_date = _parse_entry_date(body["date"])

    try:
        if updated_entry_date is not None:
            entry.entry_date = updated_entry_date

        sleep_data = body.get("sleep")
        if sleep_data and entry.sleep_report:
            if "raw_text" in sleep_data:
                entry.sleep_report.raw_text = sleep_data["raw_text"]
            if "final_text" in sleep_data:
                entry.sleep_report.final_text = sleep_data["final_text"]
            if "audio_url" in sleep_data:
                entry.sleep_report.audio_url = sleep_data["audio_url"]

        habits_data = body.get("habits")
        if habits_data and entry.habit_log:
            for field in [
                "physical_activity",
                "dinner_type",
                "bedtime_mood",
                "screen_time",
                "incidents",
                "food_notes",
                "sleep_quality",
            ]:
                if field in habits_data:
                    setattr(entry.habit_log, field, habits_data[field])

            if "total_sleep_hours" in habits_data:
                raw = habits_data.get("total_sleep_hours")
                try:
                    entry.habit_log.total_sleep_hours = (
                        float(raw) if raw not in (None, "") else None
                    )
                except (TypeError, ValueError):
                    entry.habit_log.total_sleep_hours = None

        db.session.commit()

        return jsonify({
            "message": "Daily entry updated successfully",
            "results": entry.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        raise APIException(
            f"Error updating daily entry: {str(e)}", status_code=500)
