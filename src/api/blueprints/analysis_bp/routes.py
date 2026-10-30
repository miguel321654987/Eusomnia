import json
from datetime import datetime, timezone
from typing import Any

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from api.extensions import db
from api.utils import APIException
# Import the Blueprint instance using a relative import to avoid circular dependencies
from . import analysis_bp as bp
from api.blueprints.analysis_bp.models import SleepAnalysis
from api.blueprints.analysis_bp.services import run_unified_ai_analysis
from api.blueprints.daily_entries_bp.models import DailyEntry
from api.blueprints.user_bp.models import UserPreferences


def _serialize_text_field(value: Any) -> str:
    if isinstance(value, str):
        return value
    if value is None:
        return ""
    return json.dumps(value, ensure_ascii=False)


@bp.route("/<int:entry_id>", methods=["POST"])
@jwt_required()
def analyze_daily_entry(entry_id):
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, entry_id)

    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    stmt = select(UserPreferences).where(
        UserPreferences.user_id == current_user_id)
    prefs = db.session.execute(stmt).scalar_one_or_none()

    if prefs is None:
        custom_key = None
        selected_model = "nvidia/nemotron-3.5-super-vl:free"
        interpretation_framework = "jungian"
        report_depth = "standard"
        include_nutrition = True
    else:
        custom_key = prefs.custom_api_key or None
        selected_model = prefs.selected_model
        interpretation_framework = prefs.interpretation_framework
        report_depth = prefs.report_depth
        include_nutrition = prefs.include_nutrition_in_analysis

    entry_data = entry.serialize()
    if not include_nutrition:
        entry_data["nutrition_log"] = None
        if entry_data.get("habit_log"):
            entry_data["habit_log"] = {
                key: value
                for key, value in entry_data["habit_log"].items()
                if key != "food_notes"
            }
    entry_data["_profile_preferences"] = {
        "interpretation_framework": interpretation_framework,
        "report_depth": report_depth,
    }
    analysis_data = run_unified_ai_analysis(
        entry_data, custom_key=custom_key, model=selected_model)

    analysis_values = {
        "interpretation": analysis_data.get("interpretation", ""),
        "predominant_emotions": json.dumps(
            analysis_data.get("predominant_emotions", [])),
        "detected_symbols": json.dumps(
            analysis_data.get("detected_symbols", [])),
        "habits_reading": _serialize_text_field(
            analysis_data.get("habits_reading", "")),
        "patterns_detected": _serialize_text_field(
            analysis_data.get("patterns_detected", "")),
        "recommendations": json.dumps(analysis_data.get("recommendations", [])),
        "alerts": json.dumps(analysis_data.get("alerts", [])),
        "raw_json_response": json.dumps(analysis_data),
    }

    existing_analysis = db.session.execute(
        select(SleepAnalysis).where(SleepAnalysis.entry_id == entry.id)
    ).scalar_one_or_none()

    if existing_analysis is not None:
        for field, value in analysis_values.items():
            setattr(existing_analysis, field, value)
        existing_analysis.created_at = datetime.now(timezone.utc)
        new_analysis = existing_analysis
    else:
        new_analysis = SleepAnalysis(
            entry_id=entry.id,
            **analysis_values,
        )
        db.session.add(new_analysis)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        existing_analysis = db.session.execute(
            select(SleepAnalysis).where(SleepAnalysis.entry_id == entry.id)
        ).scalar_one_or_none()
        if existing_analysis is None:
            # Extremely unlikely race: no row visible after rollback. Avoid data loss.
            new_analysis = SleepAnalysis(
                entry_id=entry.id,
                **analysis_values,
            )
            db.session.add(new_analysis)
            db.session.commit()
        else:
            for field, value in analysis_values.items():
                setattr(existing_analysis, field, value)
            existing_analysis.created_at = datetime.now(timezone.utc)
            db.session.commit()
            new_analysis = existing_analysis

    diagnostics = analysis_data.get("pipeline_diagnostics", [])
    if diagnostics:
        try:
            raw_json = json.loads(new_analysis.raw_json_response or "{}")
        except (TypeError, ValueError):
            raw_json = {}
        raw_json.setdefault("pipeline_diagnostics", [])
        raw_json["pipeline_diagnostics"] = diagnostics
        new_analysis.raw_json_response = json.dumps(raw_json, ensure_ascii=False)
        db.session.commit()

    results_payload = new_analysis.serialize()
    results_payload = results_payload.copy()
    results_payload["diagnostics"] = diagnostics

    return jsonify({
        "message": "Analysis completed successfully",
        "results": results_payload
    }), 200


@bp.route("/<int:entry_id>", methods=["GET"]) 
@jwt_required()
def get_entry_analysis(entry_id):
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, entry_id)

    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    if not entry.analysis:
        raise APIException(
            "Analysis not generated yet for this entry", status_code=404)

    return jsonify({
        "message": "Analysis retrieved successfully",
        "results": entry.analysis.serialize()
    }), 200
