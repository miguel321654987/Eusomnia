import json
import types

import pytest

from api.services.rag_graph import run_dream_rag_analysis


class DummyResponse:
    def __init__(self, status_code: int, json_data: dict):
        self.status_code = status_code
        self._json = json_data

    def raise_for_status(self):
        if not (200 <= self.status_code < 300):
            raise Exception(f"HTTP {self.status_code}")

    def json(self):
        return self._json


def _mock_post_success(*args, **kwargs):
    # Simula una respuesta válida de OpenRouter con response_format activado.
    return DummyResponse(
        200,
        {
            "choices": [
                {"message": {"content": json.dumps({"interpretation": "ok"})}}
            ]
        },
    )


def _mock_post_failure(*args, **kwargs):
    # Simula un fallo de red o de la API.
    raise Exception("connection error")


def test_fallback_success_first_model(monkeypatch):
    """El primer modelo de la lista devuelve éxito y no se marca error."""
    monkeypatch.setattr("api.services.rag_graph.requests.post", _mock_post_success)
    result = run_dream_rag_analysis(entry_payload={"raw_text": "test"})
    assert result.get("interpretation") == "ok"
    assert result.get("openrouter_error") is None or result.get("openrouter_error") is False


def test_fallback_success_third_model(monkeypatch):
    """Fallos en los dos primeros modelos y éxito en el tercero.

    El mock inspecciona el nombre del modelo enviado en el payload y falla
    sólo para los dos modelos superiores de la lista.
    """

    def _mock_post(url, json=None, **kwargs):  # type: ignore[override]
        model_name = json.get("model", "") if json else ""
        if model_name.startswith("nvidia/nemotron-3.5-super-vl") or model_name.startswith(
            "nvidia/nemotron-3.5-lightning"
        ):
            raise Exception("temporary failure")
        return _mock_post_success()

    monkeypatch.setattr("api.services.rag_graph.requests.post", _mock_post)
    result = run_dream_rag_analysis(entry_payload={"raw_text": "test"})
    assert result.get("interpretation") == "ok"
    # La respuesta no debe contener la bandera de error (o debe ser False).
    assert result.get("openrouter_error", False) is False


def test_fallback_total_failure(monkeypatch):
    """Todas las llamadas fallan; se debe indicar ``openrouter_error``."""
    monkeypatch.setattr("api.services.rag_graph.requests.post", _mock_post_failure)
    result = run_dream_rag_analysis(entry_payload={"raw_text": "test"})
    # En caso de falla total, la función devuelve un dict vacío con la bandera.
    assert result.get("openrouter_error") is True