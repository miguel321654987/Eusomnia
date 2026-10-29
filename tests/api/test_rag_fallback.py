import json
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


def test_only_configured_model_is_used(monkeypatch):
    models = []

    def mock_post(url, json=None, **kwargs):
        models.append(json["model"])
        return _mock_post_success()

    monkeypatch.setattr("api.services.rag_graph.requests.post", mock_post)
    result = run_dream_rag_analysis(entry_payload={"raw_text": "test"})

    assert result.get("interpretation") == "ok"
    assert result.get("openrouter_error", False) is False
    assert models == ["nvidia/nemotron-3.5-super-vl:free"]