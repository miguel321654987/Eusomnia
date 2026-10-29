from api.blueprints.analysis_bp import analysis_bp
from api.blueprints.analysis_bp import routes as analysis_routes


def test_analysis_route_persists_list_patterns(
    client, app, auth_header, monkeypatch
):
    app.register_blueprint(analysis_bp, url_prefix="/analysis")
    entry_id = app.extensions["test_entry_id"]
    expected_patterns = [
        "Contraste entre un día tranquilo y un sueño con una caída",
        "Posible sensación de pérdida de control",
    ]
    monkeypatch.setattr(
        analysis_routes,
        "run_unified_ai_analysis",
        lambda *args, **kwargs: {
            "interpretation": "Análisis de prueba",
            "predominant_emotions": ["inquietud"],
            "detected_symbols": [],
            "habits_reading": "Lectura de hábitos",
            "patterns_detected": expected_patterns,
            "recommendations": [],
            "alerts": [],
        },
    )

    response = client.post(
        f"/analysis/{entry_id}",
        headers=auth_header,
    )

    assert response.status_code == 200
    assert (
        response.get_json()["results"]["patterns_detected"] == expected_patterns
    )
