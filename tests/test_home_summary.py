from datetime import date, timedelta

from api.routes import api
from api.blueprints.daily_entries_bp.models import DailyEntry, HabitLog
from api.extensions import db


def test_home_summary_requires_authentication(app, client):
    app.register_blueprint(api, url_prefix="/api")

    response = client.get("/api/home-summary")

    assert response.status_code == 401


def test_home_summary_returns_user_entries_and_sample_aware_sleep_trend(
    app, client, auth_header
):
    app.register_blueprint(api, url_prefix="/api")
    today = date.today()

    with app.app_context():
        for days_ago, sleep_hours in (
            (1, 7.0),
            (2, 7.5),
            (3, 8.0),
            (8, 6.0),
            (9, 6.5),
            (10, 7.0),
        ):
            entry = DailyEntry(
                user_id=1,
                entry_date=today - timedelta(days=days_ago),
            )
            db.session.add(entry)
            db.session.flush()
            db.session.add(
                HabitLog(
                    entry_id=entry.id,
                    total_sleep_hours=sleep_hours,
                    sleep_quality="Autodeclarada",
                )
            )
        db.session.commit()

    response = client.get("/api/home-summary", headers=auth_header)

    assert response.status_code == 200
    result = response.get_json()["results"]
    assert result["pending_analysis_count"] == 7
    assert len(result["recent_entries"]) == 5
    assert result["recent_entries"][0]["sleep_hours"] == 7.0
    sleep_summary = result["sleep_summary"]
    assert sleep_summary["current_sample_size"] == 3
    assert sleep_summary["previous_sample_size"] == 3
    assert sleep_summary["current_average_hours"] == 7.5
    assert sleep_summary["previous_average_hours"] == 6.5
    assert sleep_summary["comparison_hours"] == 1.0
    assert sleep_summary["source"] == "Autodeclarado por el usuario"
