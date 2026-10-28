import json
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.extensions import db

from api.utils import APIException
from . import nutrition_bp as bp
from .services import fetch_nutrition_data
from api.blueprints.daily_entries_bp.models import DailyEntry
from api.blueprints.nutrition_bp.models import NutritionLog


@bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_nutrition():
    body = request.get_json()
    if (
        body is None
        or not isinstance(body.get("query"), str)
        or not body["query"].strip()
        or not isinstance(body.get("entry_id"), int)
        or isinstance(body.get("entry_id"), bool)
    ):
        raise APIException(
            "Food query and daily entry ID are required", status_code=400)

    query = body["query"].strip()
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, body["entry_id"])
    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)
    if not entry.habit_log or entry.habit_log.nutrition_query != query:
        raise APIException(
            "Food query must match the saved daily entry", status_code=400)

    nutrition_results = fetch_nutrition_data(query)
    nutrition_log = entry.nutrition_log or NutritionLog(entry_id=entry.id)
    nutrition_log.calories = nutrition_results["calories"]
    nutrition_log.fats_g = nutrition_results["fats_g"]
    nutrition_log.protein_g = nutrition_results["protein_g"]
    nutrition_log.carbs_g = nutrition_results["carbs_g"]
    nutrition_log.sugar_g = nutrition_results["sugar_g"]
    nutrition_log.sodium_mg = nutrition_results["sodium_mg"]
    nutrition_log.caffeine_mg = nutrition_results["caffeine_mg"]
    nutrition_log.vitamin_b12_mcg = nutrition_results["vitamin_b12_mcg"]
    nutrition_log.vitamin_e_mg = nutrition_results["vitamin_e_mg"]
    nutrition_log.raw_response = json.dumps(nutrition_results["raw_response"])
    db.session.add(nutrition_log)
    db.session.commit()

    return jsonify({
        "message": "Nutrition analysis saved successfully",
        "results": nutrition_results
    }), 200
