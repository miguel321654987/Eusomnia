import json
import os
import sys
from datetime import date

import pytest
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager, create_access_token

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import api.models  # noqa: F401
from api.blueprints.analysis_bp import routes as analysis_routes
from api.blueprints.analysis_bp.models import SleepAnalysis
from api.services import rag_graph
from api.blueprints.analysis_bp import analysis_bp
from api.blueprints.daily_entries_bp.models import DailyEntry, HabitLog, SleepReport
from api.blueprints.exports_bp import exports_bp
from api.blueprints.nutrition_bp.models import NutritionLog
from api.blueprints.user_bp import user_bp
from api.blueprints.user_bp.models import User, UserPreferences
from api.extensions import bcrypt, db
from api.utils import APIException


@pytest.fixture
def profile_client(monkeypatch):
    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        JWT_SECRET_KEY="profile-test-secret",
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
    )
    db.init_app(app)
    bcrypt.init_app(app)
    JWTManager(app)
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
    app.register_blueprint(exports_bp, url_prefix="/api/exports")

    @app.errorhandler(APIException)
    def handle_api_exception(error):
        return jsonify(error.to_dict()), error.status_code

    with app.app_context():
        db.create_all()
        user = User(
            email="profile@example.test",
            password=bcrypt.generate_password_hash("old-password").decode("utf-8"),
            name="Ada",
            last_name="Lovelace",
        )
        db.session.add(user)
        db.session.flush()
        db.session.add(UserPreferences(user_id=user.id, custom_api_key="private-key"))
        db.session.commit()
        user_id = user.id
        token = create_access_token(identity=str(user_id))

    monkeypatch.setattr(
        analysis_routes,
        "run_unified_ai_analysis",
        lambda entry_payload, custom_key=None, model=None: {
            "interpretation": "A reflective analysis.",
            "predominant_emotions": [],
            "detected_symbols": [],
            "habits_reading": "",
            "patterns_detected": "",
            "recommendations": [],
            "alerts": [],
        },
    )
    yield app.test_client(), user_id, {"Authorization": f"Bearer {token}"}

    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_profile_update_persists_personal_data_and_preferences(profile_client):
    client, _, headers = profile_client

    response = client.put(
        "/api/users/profile",
        headers=headers,
        json={
            "name": "Ada",
            "last_name": "Byron",
            "email": "ada@example.test",
            "birth_year": 1984,
            "chronotype": "lion",
            "timezone": "Europe/Madrid",
            "interpretation_framework": "holistic",
            "report_depth": "concise",
            "include_nutrition_in_analysis": False,
            "morning_reminder_time": "07:15",
        },
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["email"] == "ada@example.test"
    assert data["user"]["birth_year"] == 1984
    assert data["user"]["chronotype"] == "lion"
    assert data["preferences"]["timezone"] == "Europe/Madrid"
    assert data["preferences"]["interpretation_framework"] == "holistic"
    assert data["preferences"]["report_depth"] == "concise"
    assert data["preferences"]["include_nutrition_in_analysis"] is False
    assert data["preferences"]["morning_reminder_time"] == "07:15"
    assert "private-key" not in response.get_data(as_text=True)
    assert data["preferences"]["has_custom_key"] is True


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("chronotype", "unknown"),
        ("timezone", "Mars/Olympus"),
        ("morning_reminder_time", "25:61"),
        ("include_nutrition_in_analysis", "false"),
    ],
)
def test_profile_update_rejects_invalid_values_without_partial_changes(
    profile_client, field, value
):
    client, _, headers = profile_client

    response = client.put(
        "/api/users/profile",
        headers=headers,
        json={"name": "Changed", field: value},
    )

    assert response.status_code == 400
    profile = client.get("/api/users/profile", headers=headers).get_json()
    assert profile["user"]["name"] == "Ada"


def test_password_change_requires_current_password(profile_client):
    client, _, headers = profile_client

    rejected = client.post(
        "/api/users/profile/password",
        headers=headers,
        json={"current_password": "wrong-password", "new_password": "new-password"},
    )
    accepted = client.post(
        "/api/users/profile/password",
        headers=headers,
        json={"current_password": "old-password", "new_password": "new-password"},
    )

    assert rejected.status_code == 401
    assert accepted.status_code == 200
    login = client.post(
        "/api/users/login",
        json={"email": "profile@example.test", "password": "new-password"},
    )
    assert login.status_code == 200


def test_analysis_uses_profile_settings_and_can_exclude_nutrition(
    profile_client, monkeypatch
):
    client, user_id, headers = profile_client
    captured = {}

    def capture_analysis(entry_payload, custom_key=None, model=None):
        captured.update(payload=entry_payload, key=custom_key, model=model)
        return {
            "interpretation": "A reflective analysis.",
            "predominant_emotions": [],
            "detected_symbols": [],
            "habits_reading": "",
            "patterns_detected": "",
            "recommendations": [],
            "alerts": [],
        }

    monkeypatch.setattr(analysis_routes, "run_unified_ai_analysis", capture_analysis)
    with client.application.app_context():
        preference = db.session.query(UserPreferences).filter_by(user_id=user_id).one()
        preference.selected_model = "openrouter/free"
        preference.interpretation_framework = "neuroscientific"
        preference.report_depth = "clinical"
        preference.include_nutrition_in_analysis = False
        entry = DailyEntry(user_id=user_id, entry_date=date(2026, 2, 1))
        db.session.add(entry)
        db.session.flush()
        db.session.add(SleepReport(entry_id=entry.id, raw_text="Dream narrative"))
        db.session.add(HabitLog(entry_id=entry.id, food_notes="Dinner notes"))
        db.session.add(NutritionLog(entry_id=entry.id, caffeine_mg=80))
        entry_id = entry.id
        db.session.commit()

    response = client.post(f"/api/analysis/{entry_id}", headers=headers)

    assert response.status_code == 200
    assert captured["model"] == "openrouter/free"
    assert captured["key"] == "private-key"
    assert captured["payload"]["nutrition_log"] is None
    assert "food_notes" not in captured["payload"]["habit_log"]
    assert captured["payload"]["_profile_preferences"] == {
        "interpretation_framework": "neuroscientific",
        "report_depth": "clinical",
    }


def test_rag_prompt_applies_framework_and_depth_without_forwarding_settings(
    monkeypatch,
):
    captured = {}
    response_body = {
        "choices": [{"message": {"content": json.dumps({"interpretation": "ok"})}}]
    }

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return response_body

    def fake_post(url, **kwargs):
        captured.update(kwargs)
        return FakeResponse()

    monkeypatch.setattr(rag_graph.requests, "post", fake_post)
    rag_graph._openrouter_generate(
        {
            "dream_text": "A short dream",
            "_profile_preferences": {
                "interpretation_framework": "holistic",
                "report_depth": "concise",
            },
        },
        contexts=[],
        custom_key="test-key",
        model="openrouter/free",
    )

    prompt = captured["json"]["messages"][0]["content"]
    user_payload = json.loads(captured["json"]["messages"][1]["content"])
    assert "holistic reflective lens" in prompt
    assert "one paragraph" in prompt
    assert "_profile_preferences" not in user_payload
    assert captured["json"]["model"] == "openrouter/free"


def test_exports_are_owner_scoped_and_support_date_ranges(profile_client):
    client, user_id, headers = profile_client
    with client.application.app_context():
        first = DailyEntry(user_id=user_id, entry_date=date(2026, 2, 1))
        second = DailyEntry(user_id=user_id, entry_date=date(2026, 2, 3))
        other_user = User(
            email="other@example.test",
            password=bcrypt.generate_password_hash("other-password").decode("utf-8"),
            name="Other",
            last_name="User",
        )
        db.session.add_all([first, second, other_user])
        db.session.flush()
        db.session.add(
            SleepReport(entry_id=first.id, raw_text="First dream narrative")
        )
        db.session.add(
            SleepReport(entry_id=second.id, raw_text="Second dream narrative")
        )
        db.session.add(
            DailyEntry(user_id=other_user.id, entry_date=date(2026, 2, 2))
        )
        db.session.commit()

    query = "?start_date=2026-02-01&end_date=2026-02-02"
    json_response = client.get(f"/api/exports/json{query}", headers=headers)
    csv_response = client.get(f"/api/exports/csv{query}", headers=headers)
    pdf_response = client.get(f"/api/exports/pdf{query}", headers=headers)

    assert json_response.status_code == 200
    json_entries = json_response.get_json()["results"]
    assert len(json_entries) == 1
    assert json_entries[0]["sleep_report"]["raw_text"] == "First dream narrative"
    assert csv_response.status_code == 200
    assert "First dream narrative" in csv_response.get_data(as_text=True)
    assert "Second dream narrative" not in csv_response.get_data(as_text=True)
    assert pdf_response.status_code == 200
    assert pdf_response.mimetype == "application/pdf"
    assert pdf_response.data.startswith(b"%PDF")


@pytest.mark.parametrize(
    "query",
    [
        "?start_date=2026-02-01",
        "?start_date=20260201&end_date=2026-02-02",
        "?start_date=2026-02-03&end_date=2026-02-01",
    ],
)
def test_exports_reject_invalid_date_ranges(profile_client, query):
    client, _, headers = profile_client

    response = client.get(f"/api/exports/json{query}", headers=headers)

    assert response.status_code == 400


def test_delete_account_removes_daily_records_and_children(profile_client):
    client, user_id, headers = profile_client
    with client.application.app_context():
        entry = DailyEntry(user_id=user_id, entry_date=date(2026, 2, 1))
        db.session.add(entry)
        db.session.flush()
        db.session.add(SleepReport(entry_id=entry.id, raw_text="Private dream"))
        db.session.add(HabitLog(entry_id=entry.id, food_notes="Private notes"))
        db.session.add(NutritionLog(entry_id=entry.id, caffeine_mg=20))
        db.session.add(
            SleepAnalysis(entry_id=entry.id, interpretation="Private analysis")
        )
        entry_id = entry.id
        db.session.commit()

    response = client.delete(
        f"/api/users/{user_id}",
        headers=headers,
        json={"current_password": "old-password"},
    )

    assert response.status_code == 200
    with client.application.app_context():
        assert db.session.get(User, user_id) is None
        assert db.session.get(DailyEntry, entry_id) is None
        assert db.session.query(SleepReport).count() == 0
        assert db.session.query(HabitLog).count() == 0
        assert db.session.query(NutritionLog).count() == 0
        assert db.session.query(SleepAnalysis).count() == 0
        assert db.session.query(UserPreferences).count() == 0
