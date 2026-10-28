import json


def test_analyze_nutrition_success(client, auth_header, monkeypatch):
    """Validate that the /nutrition/analyze endpoint returns a parsed result.

    The underlying Edamam call is mocked in the global conftest fixture, so we
    only need to ensure the endpoint correctly validates input and forwards the
    query to ``services.analyze_foods``.
    """
    payload = {"query": "1 banana", "meal_type": "breakfast"}
    response = client.post("/nutrition/analyze", json=payload, headers=auth_header)
    assert response.status_code == 200
    results = response.get_json()["results"]
    # Basic sanity checks: the service returns a dictionary with at least an
    # ``ingredients`` key containing a list.
    assert isinstance(results, dict)
    # The mocked analysis provides nutrient fields; ensure at least one expected key
    assert isinstance(results.get("calories"), (int, float))


def test_analyze_nutrition_missing_query(client, auth_header):
    response = client.post("/nutrition/analyze", json={}, headers=auth_header)
    assert response.status_code == 400
    assert "Food query is required" in response.get_json()["message"]
