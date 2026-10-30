from datetime import date

import os
import sys

import pytest
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager, create_access_token

# Ensure the project src package is importable from the tests folder.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SRC_ROOT = os.path.join(PROJECT_ROOT, "src")
for _path in (SRC_ROOT, PROJECT_ROOT):
    if _path not in sys.path:
        sys.path.insert(0, _path)

import api.models  # noqa: E402,F401 - registers every mapped class
from api.extensions import db  # noqa: E402
from api.utils import APIException  # noqa: E402
from api.blueprints.daily_entries_bp.models import DailyEntry  # noqa: E402
from api.blueprints.nutrition_bp import nutrition_bp, services  # noqa: E402

# Canned Edamam response shaped like the real Full Recipe Analysis payload.
FAKE_EDAMAM_RESPONSE = {
    "uri": "http://www.edamam.com/ontologies/edamam.owl#recipe_test",
    "ingredients": [{
        "text": "mixed meal",
        "parsed": [{
            "quantity": 1.0,
            "measure": "serving",
            "weight": 300.0,
            "status": "OK",
            "nutrients": {
                "ENERC_KCAL": {"label": "Energy", "quantity": 500.0,
                               "unit": "kcal"},
                "PROCNT": {"label": "Protein", "quantity": 40.0, "unit": "g"},
                "CHOCDF": {"label": "Carbs", "quantity": 50.0, "unit": "g"},
                "SUGAR": {"label": "Sugars", "quantity": 10.0, "unit": "g"},
                "FAT": {"label": "Fat", "quantity": 20.0, "unit": "g"},
                "NA": {"label": "Sodium", "quantity": 600.0, "unit": "mg"},
                "TOCPHA": {"label": "Vitamin E", "quantity": 16.0,
                           "unit": "mg"},
                "VITB12": {"label": "Vitamin B12", "quantity": 2.4,
                           "unit": "µg"},
            },
        }],
    }],
}


@pytest.fixture()
def api_env(monkeypatch):
    """Flask app with in-memory DB, JWT auth and a mocked provider."""
    monkeypatch.setattr(
        services, "fetch_edamam_recipe",
        lambda title, lines: FAKE_EDAMAM_RESPONSE)
    monkeypatch.setattr(
        services, "fetch_edamam_ingredient",
        lambda query: FAKE_EDAMAM_RESPONSE)
    monkeypatch.setattr(
        services,
        "translate_texts",
        lambda texts, target_language, custom_key=None: list(texts),
    )
    monkeypatch.setattr(services, "translate_edamam_response", lambda data, **kwargs: data)

    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        JWT_SECRET_KEY="test-secret",
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
    )
    db.init_app(app)
    JWTManager(app)
    app.register_blueprint(nutrition_bp, url_prefix="/nutrition")

    @app.errorhandler(APIException)
    def handle_invalid_usage(error):
        return jsonify(error.to_dict()), error.status_code

    with app.app_context():
        db.create_all()
        entry = DailyEntry(user_id=1, entry_date=date(2026, 10, 16))
        db.session.add(entry)
        db.session.commit()
        entry_id = entry.id
        token = create_access_token(identity="1")
        other_token = create_access_token(identity="2")

    yield {
        "app": app,
        "client": app.test_client(),
        "entry_id": entry_id,
        "auth": {"Authorization": f"Bearer {token}"},
        "other_auth": {"Authorization": f"Bearer {other_token}"},
    }

    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_endpoints_require_authentication(api_env):
    client = api_env["client"]

    assert client.post("/nutrition/analyze", json={}).status_code == 401
    assert client.get("/nutrition/parameters").status_code == 401
    assert client.post(
        "/nutrition/evaluate", json={}).status_code == 401


def test_analyze_requires_query(api_env):
    response = api_env["client"].post(
        "/nutrition/analyze", json={}, headers=api_env["auth"])

    assert response.status_code == 400
    assert response.get_json()["message"] == "Food query is required"


def test_analyze_returns_normalized_results(api_env):
    response = api_env["client"].post(
        "/nutrition/analyze",
        json={"query": "50 g de jamón", "meal_type": "lunch",
              "caffeine_mg": 0},
        headers=api_env["auth"],
    )

    assert response.status_code == 200
    results = response.get_json()["results"]
    assert results["calories"] == 500.0
    assert results["protein_g"] == 40.0
    assert results["meal_type"] == "lunch"
    assert results["caffeine_mg"] == 0.0
    assert results["other_excitants_present"] is False


def test_log_persists_and_manual_caffeine_wins(api_env):
    response = api_env["client"].post(
        "/nutrition/log",
        json={
            "entry_id": api_env["entry_id"],
            "title": "Cena",
            "ingredients": ["50 g de jamón", "2 cafés"],
            "meal_type": "dinner",
            "caffeine_mg": 60,
        },
        headers=api_env["auth"],
    )

    assert response.status_code == 201
    results = response.get_json()["results"]
    assert results["entry_id"] == api_env["entry_id"]
    assert results["calories"] == 500.0
    assert results["meal_type"] == "dinner"
    # Manual report (60) must win over the dictionary fallback (190).
    assert results["caffeine_mg"] == 60.0
    # "cafés" is a detected excitant (presence -> negative effect).
    assert results["other_excitants_present"] is True
    assert "raw_response" not in results


def test_log_upsert_keeps_a_single_row(api_env):
    client = api_env["client"]
    headers = api_env["auth"]
    payload = {
        "entry_id": api_env["entry_id"],
        "ingredients": ["50 g de jamón"],
        "meal_type": "dinner",
    }

    first = client.post("/nutrition/log", json=payload, headers=headers)
    second = client.post("/nutrition/log", json=payload, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.get_json()["results"]["id"] == second.get_json()["results"]["id"]

    stored = client.get(
        f"/nutrition/log/{api_env['entry_id']}", headers=headers)
    assert stored.status_code == 200


def test_log_calculates_generic_meal_estimates_with_explicit_source(api_env):
    response = api_env["client"].post(
        "/nutrition/log",
        json={
            "entry_id": api_env["entry_id"],
            "meals": {
                "breakfast": {"size": "light", "time": "08:00", "foods": ""},
                "dinner": {"size": "heavy", "time": "21:30", "foods": ""},
            },
        },
        headers=api_env["auth"],
    )

    assert response.status_code == 201
    result = response.get_json()["results"]
    breakdown = result["meal_breakdown"]
    assert result["calories"] == 1200
    assert result["caffeine_mg"] is None
    assert result["analyzed"] is True
    assert breakdown["source"] == "generic"
    assert breakdown["items"][0]["source"] == "generic"
    assert breakdown["items"][0]["values"]["calories"] == 350
    assert breakdown["items"][1]["values"]["calories"] == 850
    assert breakdown["items"][0]["reference_note"]


def test_log_keeps_edamam_and_generic_sources_separate(api_env):
    response = api_env["client"].post(
        "/nutrition/log",
        json={
            "entry_id": api_env["entry_id"],
            "meals": {
                "breakfast": {"size": "light", "time": "08:00", "foods": ""},
                "dinner": {
                    "size": None,
                    "time": "21:00",
                    "foods": "150 g de arroz",
                },
            },
        },
        headers=api_env["auth"],
    )

    assert response.status_code == 201
    result = response.get_json()["results"]
    breakdown = result["meal_breakdown"]
    assert breakdown["source"] == "mixed"
    assert breakdown["items"][0]["source"] == "generic"
    assert breakdown["items"][1]["source"] == "edamam"
    assert result["calories"] == 850
    assert result["caffeine_mg"] is None


def test_log_rejects_empty_meal_breakdown(api_env):
    response = api_env["client"].post(
        "/nutrition/log",
        json={"entry_id": api_env["entry_id"], "meals": {}},
        headers=api_env["auth"],
    )

    assert response.status_code == 400
    assert "At least one meal" in response.get_json()["message"]


def test_log_rejects_unknown_meal_type(api_env):
    response = api_env["client"].post(
        "/nutrition/log",
        json={
            "entry_id": api_env["entry_id"],
            "ingredients": ["50 g de jamón"],
            "meal_type": "midnight",
        },
        headers=api_env["auth"],
    )

    assert response.status_code == 400
    assert "meal_type" in response.get_json()["message"]


def test_log_rejects_foreign_entries(api_env):
    response = api_env["client"].post(
        "/nutrition/log",
        json={
            "entry_id": api_env["entry_id"],
            "ingredients": ["50 g de jamón"],
            "meal_type": "dinner",
        },
        headers=api_env["other_auth"],
    )

    assert response.status_code == 404


def test_get_log_for_entry(api_env):
    client = api_env["client"]
    headers = api_env["auth"]
    client.post(
        "/nutrition/log",
        json={
            "entry_id": api_env["entry_id"],
            "ingredients": ["50 g de jamón"],
            "meal_type": "dinner",
        },
        headers=headers,
    )

    response = client.get(
        f"/nutrition/log/{api_env['entry_id']}", headers=headers)

    assert response.status_code == 200
    results = response.get_json()["results"]
    assert results["meal_type"] == "dinner"
    assert results["protein_g"] == 40.0
    assert results["vitamin_b12_ug"] == 2.4


def test_parameters_exposes_reference_ranges(api_env):
    response = api_env["client"].get(
        "/nutrition/parameters", headers=api_env["auth"])

    assert response.status_code == 200
    results = response.get_json()["results"]
    for key in ("metadata", "user_profile", "nutrients", "meals",
                "calculation_rules"):
        assert key in results
    assert results["nutrients"]["caffeine_mg"]["max_ref"] == 200
    assert results["meals"]["dinner"]["weight_factor"] == 1.5


def test_evaluate_returns_statuses_and_excitants(api_env):
    client = api_env["client"]
    headers = api_env["auth"]
    client.post(
        "/nutrition/log",
        json={
            "entry_id": api_env["entry_id"],
            "ingredients": ["50 g de jamón", "2 cafés"],
            "meal_type": "dinner",
            "caffeine_mg": 60,
        },
        headers=headers,
    )

    response = client.post(
        "/nutrition/evaluate",
        json={"entry_id": api_env["entry_id"], "weight_kg": 70},
        headers=headers,
    )

    assert response.status_code == 200
    results = response.get_json()["results"]
    statuses = {item["nutrient"]: item for item in results["nutrient_statuses"]}

    assert statuses["caffeine_mg"]["status"] == "within"   # 60 <= 200
    assert statuses["alcohol_g"]["status"] == "within"     # 0 <= 14
    assert statuses["omega3_mg"]["status"] == "below"      # 0 < 250
    assert statuses["vitamin_e_mg"]["status"] == "within"  # 16 >= 15
    assert statuses["vitamin_b12_µg"]["status"] == "within"  # 2.4 >= 2.4
    assert statuses["protein_g"]["status"] == "below"      # 40 < 56
    assert statuses["carbohydrates_percent"]["status"] == "below"  # 40 %
    assert statuses["sugars_percent"]["status"] == "within"  # 8 %

    assert results["excitants"] == {"present": True, "effect": "negative"}
    dinner = results["meal_distribution"][-1]
    assert dinner["meal_type"] == "dinner"
    assert dinner["share"] == 0.3333
    assert abs(dinner["values"]["caffeine_mg"] - 20.0) < 0.01


def test_evaluate_rejects_out_of_range_weight(api_env):
    response = api_env["client"].post(
        "/nutrition/evaluate",
        json={"entry_id": api_env["entry_id"], "weight_kg": 300},
        headers=api_env["auth"],
    )

    assert response.status_code == 400
    assert "weight_kg" in response.get_json()["message"]


def test_evaluate_returns_404_without_log(api_env):
    with api_env["app"].app_context():
        empty_entry = DailyEntry(user_id=1, entry_date=date(2026, 10, 15))
        db.session.add(empty_entry)
        db.session.commit()
        empty_id = empty_entry.id

    response = api_env["client"].post(
        "/nutrition/evaluate",
        json={"entry_id": empty_id, "weight_kg": 70},
        headers=api_env["auth"],
    )

    assert response.status_code == 404
