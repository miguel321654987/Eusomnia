import json
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import select

from api.extensions import db
from api.utils import APIException
# Importación relativa al blueprint ya creado para evitar ciclo de importación
from . import analysis_bp
from api.blueprints.analysis_bp.models import SleepAnalysis
from api.blueprints.analysis_bp.services import run_unified_ai_analysis
from api.blueprints.daily_entries_bp.models import DailyEntry
from api.blueprints.user_bp.models import UserPreferences


@analysis_bp.route("/<int:entry_id>", methods=["POST"])
@jwt_required()
def analyze_daily_entry(entry_id):
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, entry_id)

    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    stmt = select(UserPreferences).where(
        UserPreferences.user_id == current_user_id)
    prefs = db.session.execute(stmt).scalar_one_or_none()

    custom_key = prefs.custom_api_key if prefs and prefs.custom_api_key else None
    selected_model = prefs.selected_model if prefs and prefs.selected_model else None

    entry_data = entry.serialize()
    analysis_data = run_unified_ai_analysis(
        entry_data, custom_key=custom_key, model=selected_model)

    existing_analysis = entry.analysis
    if existing_analysis:
        db.session.delete(existing_analysis)
        db.session.flush()

    new_analysis = SleepAnalysis(
        entry_id=entry.id,
        interpretation=analysis_data.get("interpretation", ""),
        predominant_emotions=json.dumps(
            analysis_data.get("predominant_emotions", [])),
        detected_symbols=json.dumps(analysis_data.get("detected_symbols", [])),
        habits_reading=analysis_data.get("habits_reading", ""),
        patterns_detected=analysis_data.get("patterns_detected", ""),
        recommendations=json.dumps(analysis_data.get("recommendations", [])),
        alerts=json.dumps(analysis_data.get("alerts", [])),
        raw_json_response=json.dumps(analysis_data)
    )

    db.session.add(new_analysis)
    db.session.commit()

    return jsonify({
        "message": "Analysis completed successfully",
        "results": new_analysis.serialize()
    }), 200


@analysis_bp.route("/<int:entry_id>", methods=["GET"])
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
