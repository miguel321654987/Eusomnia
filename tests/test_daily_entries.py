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
    assert entry["sleep_report"]["raw_text"] == "Dormí ocho horas"


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
