import json

from datetime import date


def test_create_and_retrieve_daily_entry(client, auth_header, app):
    # Create a new daily entry with sleep and habit data
    payload = {
        "date": "2026-10-18",
        "sleep": {"raw_text": "Dormí ocho horas"},
        "habits": {
            "physical_activity": "30 min",
            "dinner_type": "light",
            "bedtime_mood": "relaxed",
            "screen_time": 60,
            "incidents": "none",
            "food_notes": "sin notas",
        },
    }
    response = client.post("/daily", json=payload, headers=auth_header)
    assert response.status_code == 201
    data = response.get_json()["results"]
    entry_id = data["id"]

    # Retrieve the list of entries and ensure the new one appears
    list_resp = client.get("/daily", headers=auth_header)
    assert list_resp.status_code == 200
    entries = list_resp.get_json()["results"]
    assert any(e["id"] == entry_id for e in entries)

    # Retrieve by ID
    get_resp = client.get(f"/daily/{entry_id}", headers=auth_header)
    assert get_resp.status_code == 200
    entry = get_resp.get_json()["results"]
    assert entry["entry_date"] == "2026-10-18"
    assert entry["original_entry_date"] == "2026-10-18"
    assert entry["sleep_report"]["raw_text"] == "Dormí ocho horas"


def test_daily_entry_persists_structured_meal_entries(client, auth_header):
    meal_entries = {
        "breakfast": {"size": "light", "time": "08:15", "foods": ""},
        "mid_morning": {"size": None, "time": "11:00", "foods": ""},
        "lunch": {"size": None, "time": "14:00", "foods": "150 g de arroz"},
        "snack": {"size": None, "time": "17:30", "foods": ""},
        "dinner": {"size": None, "time": "21:00", "foods": ""},
        "other": {"size": None, "time": "23:10", "foods": "Un yogur"},
    }
    response = client.post(
        "/daily",
        json={
            "sleep": {"raw_text": "Sueño de prueba"},
            "habits": {"meal_entries": meal_entries},
        },
        headers=auth_header,
    )

    assert response.status_code == 201
    result = response.get_json()["results"]
    assert result["habit_log"]["meal_entries"] == meal_entries

    updated_meals = {**meal_entries, "dinner": {
        "size": None, "time": "22:00", "foods": "Pizza",
    }}
    update_response = client.patch(
        f"/daily/{result['id']}",
        json={"habits": {"meal_entries": updated_meals}},
        headers=auth_header,
    )
    assert update_response.status_code == 200
    assert update_response.get_json()["results"]["habit_log"][
        "meal_entries"
    ] == updated_meals


def test_daily_entry_persists_sleep_context(client, auth_header):
    sleep_context = {
        "bedtime": "23:10",
        "wake_time": "07:05",
        "last_caffeine_time": "16:00",
        "room_temperature_c": 18.5,
        "room_light": "dark",
    }
    response = client.post(
        "/daily",
        json={
            "sleep": {"raw_text": "Sueño de prueba"},
            "habits": {"sleep_context": sleep_context},
        },
        headers=auth_header,
    )

    assert response.status_code == 201
    result = response.get_json()["results"]
    assert result["habit_log"]["sleep_context"] == sleep_context

    updated_context = {**sleep_context, "room_light": "dim"}
    update_response = client.patch(
        f"/daily/{result['id']}",
        json={"habits": {"sleep_context": updated_context}},
        headers=auth_header,
    )
    assert update_response.status_code == 200
    assert update_response.get_json()["results"]["habit_log"][
        "sleep_context"
    ] == updated_context


def test_daily_entry_rejects_invalid_sleep_context(client, auth_header):
    response = client.post(
        "/daily",
        json={
            "sleep": {"raw_text": "Sueño de prueba"},
            "habits": {
                "sleep_context": {
                    "bedtime": "25:90",
                    "room_temperature_c": 41,
                }
            },
        },
        headers=auth_header,
    )

    assert response.status_code == 400
    assert "bedtime" in response.get_json()["message"]


def test_daily_entry_rejects_invalid_meal_fields(client, auth_header):
    response = client.post(
        "/daily",
        json={
            "sleep": {"raw_text": "Sueño de prueba"},
            "habits": {
                "meal_entries": {
                    "dinner": {"size": "huge", "time": "25:90", "foods": ""}
                }
            },
        },
        headers=auth_header,
    )

    assert response.status_code == 400
    assert "size" in response.get_json()["message"]


def test_update_daily_entry_preserves_original_date(client, auth_header, app):
    from api.blueprints.daily_entries_bp.models import DailyEntry, HabitLog
    from api.extensions import db

    entry_id = app.extensions["test_entry_id"]
    with app.app_context():
        entry = db.session.get(DailyEntry, entry_id)
        entry.habit_log = HabitLog(
            entry_id=entry_id,
            total_sleep_hours=6.5,
            sleep_quality="Intermedio",
        )
        db.session.commit()

    response = client.patch(
        f"/daily/{entry_id}",
        json={
            "date": "2026-10-21",
            "sleep": {"raw_text": "Relato actualizado"},
            "habits": {"total_sleep_hours": 7.5, "sleep_quality": "Profundo"},
        },
        headers=auth_header,
    )

    assert response.status_code == 200
    entry = response.get_json()["results"]
    assert entry["entry_date"] == "2026-10-21"
    assert entry["original_entry_date"] == "2026-10-16"
    assert entry["habit_log"]["total_sleep_hours"] == 7.5
    assert entry["habit_log"]["sleep_quality"] == "Profundo"


def test_update_daily_entry_rejects_invalid_date(client, auth_header, app):
    entry_id = app.extensions["test_entry_id"]

    response = client.patch(
        f"/daily/{entry_id}",
        json={"date": "not-a-date"},
        headers=auth_header,
    )

    assert response.status_code == 400
    entry = client.get(f"/daily/{entry_id}", headers=auth_header).get_json()[
        "results"
    ]
    assert entry["entry_date"] == "2026-10-16"
    assert entry["original_entry_date"] == "2026-10-16"


def test_create_daily_entry_preserves_nutrition_query(
    client, auth_header
):
    payload = {
        "sleep": {"raw_text": "Relato de prueba"},
        "habits": {
            "nutrition_query": "1 hamburguesa y una ensalada",
        },
    }

    response = client.post("/daily", json=payload, headers=auth_header)

    assert response.status_code == 201
    assert (
        response.get_json()["results"]["habit_log"]["food_notes"]
        == "1 hamburguesa y una ensalada"
    )


def test_daily_entry_access_control(client, auth_header, app):
    # Use a different user token to ensure 404 is raised for unauthorized access
    from flask_jwt_extended import create_access_token
    # Generate token for a different user inside an app context
    with app.app_context():
        other_token = {"Authorization": f"Bearer {create_access_token(identity='2')}"}

    # Attempt to fetch the seeded entry (id stored in app.extensions)
    seeded_id = app.extensions["test_entry_id"]
    resp = client.get(f"/daily/{seeded_id}", headers=other_token)
    assert resp.status_code == 404
