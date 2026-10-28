import os
import sys
from datetime import date

import pytest
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager, create_access_token

# Ensure the src package is importable from the tests directory.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import api.models  # noqa: F401 – registers ORM models
from api.extensions import db
from api.utils import APIException
from api.blueprints.daily_entries_bp import daily_entries_bp, models as de_models
from api.blueprints.nutrition_bp import nutrition_bp, services


@pytest.fixture(scope="function")
def app(monkeypatch):
    """Create a Flask app configured for testing.

    The fixture also mocks the external Edamam calls used by the nutrition
    services so the test suite runs offline and deterministically.
    """
    # Mock external provider functions
    monkeypatch.setattr(
        services,
        "fetch_edamam_recipe",
        lambda title, lines: {
            "uri": "http://example.com/recipe",
            "ingredients": [{"text": title, "parsed": []}],
        },
    )
    monkeypatch.setattr(
        services,
        "fetch_edamam_ingredient",
        lambda query: {
            "uri": "http://example.com/ingredient",
            "ingredients": [{"text": query, "parsed": []}],
        },
    )
    monkeypatch.setattr(services, "translate_text", lambda text: text)

    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        JWT_SECRET_KEY="test-secret",
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
    )
    db.init_app(app)
    JWTManager(app)
    app.register_blueprint(daily_entries_bp, url_prefix="/daily")
    app.register_blueprint(nutrition_bp, url_prefix="/nutrition")

    @app.errorhandler(APIException)
    def handle_invalid_usage(error):
        return jsonify(error.to_dict()), error.status_code

    with app.app_context():
        db.create_all()
        # Seed a DailyEntry for the default test user (id=1)
        entry = de_models.DailyEntry(user_id=1, entry_date=date(2026, 10, 16))
        db.session.add(entry)
        db.session.commit()
        app.extensions["test_entry_id"] = entry.id

    yield app

    # Teardown
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function")
def auth_header(app):
    """Create an Authorization header for the default test user.

    The token generation needs an active Flask application context, which we
    obtain by entering ``app.app_context()``.
    """
    with app.app_context():
        token = create_access_token(identity="1")
    return {"Authorization": f"Bearer {token}"}
