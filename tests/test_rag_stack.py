import pathlib

from api.services.qdrant_service import DreamRetrievalService
from api.services.rag_graph import build_dream_rag_graph, run_dream_rag_analysis


def test_rag_stack_imports_and_builds_graph():
    graph = build_dream_rag_graph(
        generation_function=lambda payload, contexts, custom_key, model: {"ok": True}
    )
    assert hasattr(graph, "invoke")


def test_run_dream_rag_analysis_returns_analysis():
    result = run_dream_rag_analysis(
        {"sleep_report": {"raw_text": "Soñe un felino"}},
        generation_function=lambda payload, contexts, custom_key, model: {
            "interpretation": "ok",
            "contexts": contexts,
        },
    )
    assert result == {"interpretation": "ok", "contexts": []}


def test_prohibited_sentence_transformers_references_are_absent():
    root = pathlib.Path("/workspaces")
    matches = []
    for folder in ("src", "tests"):
        for path in (root / folder).rglob("*.py"):
            if "sentence" + "-transformers" in path.read_text(encoding="utf-8"):
                matches.append(str(path))
    assert matches == []
