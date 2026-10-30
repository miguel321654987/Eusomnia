from api.blueprints.analysis_bp import analysis_bp
from api.blueprints.analysis_bp import routes as analysis_routes
from api.blueprints.analysis_bp.models import SleepAnalysis
from api.extensions import db


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


def test_reanalyzing_entry_updates_existing_analysis(
    client, app, auth_header, monkeypatch
):
    app.register_blueprint(analysis_bp, url_prefix="/analysis")
    entry_id = app.extensions["test_entry_id"]
    monkeypatch.setattr(
        analysis_routes,
        "run_unified_ai_analysis",
        lambda *args, **kwargs: {
            "interpretation": "Nueva interpretación",
            "predominant_emotions": ["calma"],
            "detected_symbols": [],
            "habits_reading": "Lectura actualizada",
            "patterns_detected": [],
            "recommendations": [],
            "alerts": [],
        },
    )

    first_response = client.post(
        f"/analysis/{entry_id}",
        headers=auth_header,
    )
    first_analysis_id = first_response.get_json()["results"]["id"]

    second_response = client.post(
        f"/analysis/{entry_id}",
        headers=auth_header,
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    result = second_response.get_json()["results"]
    assert result["id"] == first_analysis_id
    assert result["interpretation"] == "Nueva interpretación"

    with app.app_context():
        analyses = db.session.query(SleepAnalysis).filter_by(
            entry_id=entry_id
        ).all()
        assert len(analyses) == 1
