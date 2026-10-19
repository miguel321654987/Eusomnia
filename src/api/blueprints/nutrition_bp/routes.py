"""Nutrition endpoints: analysis proxies, per-entry logs and evaluation."""

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select

from api.extensions import db
from api.utils import APIException
from api.blueprints.daily_entries_bp.models import DailyEntry
# Import relativo al paquete que ya contiene `nutrition_bp`
from . import nutrition_bp as bp
from .loader import load_sleep_params
from .models import NutritionLog
from .services import analyze_foods, evaluate_nutrition


def _percentage(nutrient_g: float, calories: float) -> float | None:
    """Energy percentage of a macronutrient (4 kcal per gram)."""
    if calories <= 0:
        return None
    return round(nutrient_g * 4.0 / calories * 100.0, 2)


def _validate_meal_type(meal_type, params) -> str | None:
    """Return the meal type after validating it against JSON meals."""
    if meal_type is None:
        return None
    allowed = list(params["meals"].keys())
    if meal_type not in allowed:
        raise APIException(
            f"meal_type must be one of: {', '.join(allowed)}",
            status_code=400,
        )
    return meal_type


def _parse_ingredients(body: dict) -> list[str]:
    """Validate the ingredient lines list sent by the client."""
    ingredients = body.get("ingredients")
    if not isinstance(ingredients, list) or not ingredients:
        raise APIException(
            "ingredients must be a non-empty list", status_code=400)
    lines = [
        str(item).strip() for item in ingredients if str(item).strip()
    ]
    if not lines:
        raise APIException(
            "ingredients must contain at least one non-empty line",
            status_code=400,
        )
    return lines


def _parse_manual(body: dict) -> dict[str, float | None]:
    """Validate the optional manual caffeine/alcohol/omega-3 reports."""
    manual: dict[str, float | None] = {}
    for field in ("caffeine_mg", "alcohol_g", "omega3_mg"):
        raw_value = body.get(field)
        if raw_value is None:
            manual[field] = None
            continue
        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            raise APIException(f"{field} must be a number", status_code=400)
        if value < 0:
            raise APIException(
                f"{field} must not be negative", status_code=400)
        manual[field] = value
    return manual


@bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_nutrition():
    """Analyze a single free-text food query (not persisted)."""
    body = request.get_json()
    if body is None or not body.get("query"):
        raise APIException("Food query is required", status_code=400)

    query = str(body.get("query")).strip()
    params = load_sleep_params()
    meal_type = _validate_meal_type(body.get("meal_type"), params)

    results = analyze_foods(
        title=query,
        ingredient_lines=[query],
        meal_type=meal_type,
        manual=_parse_manual(body),
    )

    return jsonify({
        "message": "Nutrition analysis retrieved successfully",
        "results": results
    }), 200


@bp.route("/analyze-recipe", methods=["POST"])
@jwt_required()
def analyze_recipe():
    """Analyze a recipe given as ingredient lines (not persisted)."""
    body = request.get_json()
    if body is None:
        raise APIException("JSON body is required", status_code=400)

    ingredients = _parse_ingredients(body)
    params = load_sleep_params()
    meal_type = _validate_meal_type(body.get("meal_type"), params)

    results = analyze_foods(
        title=str(body.get("title") or "Recipe").strip(),
        ingredient_lines=ingredients,
        meal_type=meal_type,
        manual=_parse_manual(body),
    )

    return jsonify({
        "message": "Recipe nutrition analysis retrieved successfully",
        "results": results
    }), 200


@bp.route("/log", methods=["POST"])
@jwt_required()
def save_nutrition_log():
    """Analyze foods and upsert the NutritionLog of a daily entry."""
    current_user_id = int(get_jwt_identity())
    body = request.get_json()
    if body is None:
        raise APIException("JSON body is required", status_code=400)
    if body.get("entry_id") is None:
        raise APIException("entry_id is required", status_code=400)

    try:
        entry = db.session.get(DailyEntry, int(body.get("entry_id")))
    except (TypeError, ValueError):
        raise APIException("entry_id must be an integer", status_code=400)

    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    params = load_sleep_params()
    meal_type = _validate_meal_type(body.get("meal_type"), params)
    ingredients = _parse_ingredients(body)
    manual = _parse_manual(body)

    results = analyze_foods(
        title=str(body.get("title") or "Meal").strip(),
        ingredient_lines=ingredients,
        meal_type=meal_type,
        manual=manual,
    )

    try:
        stmt = select(NutritionLog).where(NutritionLog.entry_id == entry.id)
        log = db.session.execute(stmt).scalar_one_or_none()
        if log is None:
            # Instanciar el modelo sin pasar argumentos nombrados para evitar
            # advertencias de Pylance sobre parámetros inexistentes en el
            # constructor generado por SQLAlchemy.
            log = NutritionLog()
            log.entry_id = entry.id
            db.session.add(log)

        log.calories = results["calories"]
        log.protein_g = results["protein_g"]
        log.carbohydrates_g = results["carbohydrates_g"]
        log.sugar_g = results["sugars_g"]
        log.fat_g = results["fat_g"]
        log.caffeine_mg = results["caffeine_mg"]
        log.alcohol_g = results["alcohol_g"]
        log.omega3_mg = results["omega3_mg"]
        log.sodium_mg = results["sodium_mg"]
        log.vitamin_e_mg = results["vitamin_e_mg"]
        log.vitamin_b12_ug = results["vitamin_b12_ug"]
        log.total_weight_g = results["total_weight_g"]
        log.meal_type = results["meal_type"]
        log.other_excitants_present = results["other_excitants_present"]
        log.raw_response = results["raw_response"]
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        raise APIException(
            f"Error saving nutrition log: {str(exc)}", status_code=500)

    return jsonify({
        "message": "Nutrition log saved successfully",
        "results": log.serialize()
    }), 201


@bp.route("/log/<int:entry_id>", methods=["GET"])
@jwt_required()
def get_nutrition_log(entry_id):
    """Return the NutritionLog stored for a daily entry."""
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, entry_id)

    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    stmt = select(NutritionLog).where(NutritionLog.entry_id == entry_id)
    log = db.session.execute(stmt).scalar_one_or_none()

    if log is None:
        raise APIException(
            "Nutrition log not found for this entry", status_code=404)

    return jsonify({
        "message": "Nutrition log retrieved successfully",
        "results": log.serialize()
    }), 200


@bp.route("/logs", methods=["GET"])
@jwt_required()
def list_nutrition_logs():
    """Return a paginated list of the current user's NutritionLog entries.

    Query parameters (optional):
        - ``page`` (int): page number, default 1.
        - ``per_page`` (int): items per page, default 20.
    """
    current_user_id = int(get_jwt_identity())
    # Extract pagination parameters with safe defaults.
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        raise APIException("Pagination parameters must be integers", status_code=400)

    if page < 1 or per_page < 1:
        raise APIException("Pagination parameters must be positive", status_code=400)

    # Build query joining NutritionLog with DailyEntry to enforce ownership.
    stmt = (
        select(NutritionLog)
        .join(DailyEntry, NutritionLog.entry_id == DailyEntry.id)
        .where(DailyEntry.user_id == current_user_id)
        .order_by(NutritionLog.id.desc())
        .limit(per_page)
        .offset((page - 1) * per_page)
    )
    logs = db.session.execute(stmt).scalars().all()

    # Serialize each log.
    results = [log.serialize() for log in logs]
    return jsonify({
        "message": "Nutrition logs list retrieved successfully",
        "results": results,
        "page": page,
        "per_page": per_page,
    }), 200


@bp.route("/log/<int:entry_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_nutrition_log(entry_id):
    """Partial update of an existing NutritionLog.

    Allows updating any mutable numeric field (e.g., calories, protein_g, ...).
    Fields not provided remain unchanged.
    """
    current_user_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}

    # Locate the associated DailyEntry to verify ownership.
    entry = db.session.get(DailyEntry, entry_id)
    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    # Fetch the NutritionLog; must exist to update.
    stmt = select(NutritionLog).where(NutritionLog.entry_id == entry.id)
    log = db.session.execute(stmt).scalar_one_or_none()
    if log is None:
        raise APIException("Nutrition log not found for this entry", status_code=404)

    # List of fields that can be patched.
    mutable_fields = [
        "calories",
        "protein_g",
        "carbohydrates_g",
        "sugars_g",
        "fat_g",
        "caffeine_mg",
        "alcohol_g",
        "omega3_mg",
        "sodium_mg",
        "vitamin_e_mg",
        "vitamin_b12_ug",
        "total_weight_g",
        "meal_type",
        "other_excitants_present",
    ]

    # Apply updates with validation.
    for field in mutable_fields:
        if field in body:
            value = body[field]
            # Simple numeric validation for most fields.
            if field in (
                "calories",
                "protein_g",
                "carbohydrates_g",
                "sugars_g",
                "fat_g",
                "caffeine_mg",
                "alcohol_g",
                "omega3_mg",
                "sodium_mg",
                "vitamin_e_mg",
                "vitamin_b12_ug",
                "total_weight_g",
            ):
                try:
                    numeric = float(value)
                except (TypeError, ValueError):
                    raise APIException(f"{field} must be a number", status_code=400)
                if numeric < 0:
                    raise APIException(f"{field} cannot be negative", status_code=400)
                setattr(log, field, numeric)
            elif field == "meal_type":
                # Validate against sleep params if provided.
                params = load_sleep_params()
                if value is not None:
                    allowed = list(params["meals"].keys())
                    if value not in allowed:
                        raise APIException(
                            f"meal_type must be one of: {', '.join(allowed)}",
                            status_code=400,
                        )
                setattr(log, field, value)
            else:
                # Boolean or nullable fields.
                setattr(log, field, value)

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        raise APIException(f"Error updating nutrition log: {str(exc)}", status_code=500)

    return jsonify({
        "message": "Nutrition log updated successfully",
        "results": log.serialize(),
    }), 200


@bp.route("/log/<int:entry_id>", methods=["DELETE"])
@jwt_required()
def delete_nutrition_log(entry_id):
    """Delete the NutritionLog linked to a DailyEntry.

    Only the owner of the entry can delete its nutrition log.
    """
    current_user_id = int(get_jwt_identity())
    entry = db.session.get(DailyEntry, entry_id)
    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    stmt = select(NutritionLog).where(NutritionLog.entry_id == entry.id)
    log = db.session.execute(stmt).scalar_one_or_none()
    if log is None:
        raise APIException("Nutrition log not found for this entry", status_code=404)

    try:
        db.session.delete(log)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        raise APIException(f"Error deleting nutrition log: {str(exc)}", status_code=500)

    return jsonify({
        "message": "Nutrition log deleted successfully"
    }), 200


@bp.route("/parameters", methods=["GET"])
@jwt_required()
def get_nutrition_parameters():
    """Expose the reference parameters used for sleep correlation."""
    params = load_sleep_params()

    return jsonify({
        "message": "Nutrition sleep parameters retrieved successfully",
        "results": params
    }), 200


@bp.route("/evaluate", methods=["POST"])
@jwt_required()
def evaluate_entry_nutrition():
    """Evaluate a stored NutritionLog against the JSON parameters."""
    current_user_id = int(get_jwt_identity())
    # Se obtiene el cuerpo de la solicitud y se valida la presencia y tipo de "entry_id".
    # Separamos la obtención del valor de la conversión a int para evitar que
    # Pylance detecte un posible "None" al pasar directamente el resultado de
    # ``dict.get`` a ``int``.
    body = request.get_json(silent=True) or {}
    entry_id_raw = body.get("entry_id")
    if entry_id_raw is None:
        raise APIException("entry_id is required", status_code=400)

    try:
        entry_id = int(entry_id_raw)
    except (TypeError, ValueError):
        raise APIException("entry_id must be an integer", status_code=400)

    # Validate the payload before looking up resources so malformed input
    # always returns 400 instead of masking it behind a 404.
    params = load_sleep_params()
    weight_profile = params["user_profile"]["weight_kg"]
    weight_kg = body.get("weight_kg")
    if weight_kg is not None:
        try:
            weight_kg = float(weight_kg)
        except (TypeError, ValueError):
            raise APIException("weight_kg must be a number", status_code=400)
        if not weight_profile["min"] <= weight_kg <= weight_profile["max"]:
            raise APIException(
                f"weight_kg must be between {weight_profile['min']} "
                f"and {weight_profile['max']}",
                status_code=400,
            )

    entry = db.session.get(DailyEntry, entry_id)
    if entry is None or entry.user_id != current_user_id:
        raise APIException("Daily entry not found", status_code=404)

    stmt = select(NutritionLog).where(NutritionLog.entry_id == entry.id)
    log = db.session.execute(stmt).scalar_one_or_none()

    if log is None:
        raise APIException(
            "Nutrition log not found for this entry", status_code=404)

    values = {
        "vitamin_e_mg": log.vitamin_e_mg,
        "vitamin_b12_µg": log.vitamin_b12_ug,
        "protein_g": log.protein_g,
        "carbohydrates_percent": _percentage(
            log.carbohydrates_g, log.calories),
        "sugars_percent": _percentage(log.sugar_g, log.calories),
        "alcohol_g": log.alcohol_g,
        "caffeine_mg": log.caffeine_mg,
        "omega3_mg": log.omega3_mg,
        "carbohydrates_g": log.carbohydrates_g,
        "sugars_g": log.sugar_g,
        "other_excitants_present": log.other_excitants_present,
    }

    evaluation = evaluate_nutrition(values, weight_kg)

    return jsonify({
        "message": "Nutrition evaluation completed successfully",
        "results": {
            "entry_id": entry.id,
            "meal_type": log.meal_type,
            "weight_kg": weight_kg,
            "parameters_last_update": params["metadata"]["last_update"],
            **evaluation,
        }
    }), 200



