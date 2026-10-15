from flask import request, jsonify
from flask_jwt_extended import jwt_required

from api.utils import APIException
# Importaciones relativas para eliminar el ciclo de importación
from . import nutrition_bp
from .services import fetch_nutrition_data


@nutrition_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_nutrition():
    body = request.get_json()
    if body is None or not body.get("query"):
        raise APIException("Food query is required", status_code=400)

    query = body.get("query")
    nutrition_results = fetch_nutrition_data(query)

    return jsonify({
        "message": "Nutrition analysis retrieved successfully",
        "results": nutrition_results
    }), 200

