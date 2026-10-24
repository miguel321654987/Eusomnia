"""LangGraph orchestration for Eusomnia's dream-analysis RAG flow."""

from __future__ import annotations

import json
import os
from typing import Any, Callable

try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict
import requests

from langgraph.graph import END, START, StateGraph

from api.services.qdrant_service import DreamRetrievalService
from api.services.embedding_provider import EmbeddingProvider
from api.utils import APIException


class DreamRagState(TypedDict, total=False):
    """State exchanged between RAG graph nodes."""

    dream_text: str
    entry_payload: dict[str, Any]
    contexts: list[str]
    custom_key: str | None
    selected_model: str | None
    analysis: dict[str, Any]


def extract_dream_text(payload: Any) -> str:
    """Find the natural-language dream text in a serialized entry."""
    if isinstance(payload, str):
        return payload
    if not isinstance(payload, dict):
        return str(payload or "").strip()

    for key in ("final_text", "raw_text", "dream_text", "sleep_text", "text"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    sleep_report = payload.get("sleep_report") or payload.get("sleep")
    if isinstance(sleep_report, dict):
        for key in ("final_text", "raw_text", "dream_text", "text"):
            value = sleep_report.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return ""


def _openrouter_generate(
    entry_payload: dict[str, Any],
    contexts: list[str] | None,
    custom_key: str | None,
    model: str | None,
) -> dict[str, Any]:
    api_key = custom_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise APIException("AI provider API key is not configured", status_code=500)

    selected_model = model or os.getenv(
        "OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free"
    )
    enriched_payload = dict(entry_payload or {})
    if contexts:
        enriched_payload["_rag_context"] = contexts

    system_prompt = (
        "You are an expert sleep hygiene and dream analysis assistant for Eusomnia. "
        "Analyze the provided daily log containing sleep narrative, habits and nutrition. "
        "Return ONLY a valid JSON object with keys: interpretation, predominant_emotions, "
        "detected_symbols, habits_reading, patterns_detected, recommendations, alerts."
    )
    url = "https://openrouter.ai/api/v1/chat/completions"

    try:
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": selected_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(enriched_payload)},
                ],
                "response_format": {"type": "json_object"},
            },
            timeout=30,
        )
        response.raise_for_status()
        raw_result = response.json()
        content = raw_result["choices"][0]["message"]["content"]
        return json.loads(content)
    except requests.exceptions.RequestException as exc:
        raise APIException(f"Error querying AI provider: {str(exc)}", status_code=502)
    except (KeyError, TypeError, json.JSONDecodeError) as exc:
        raise APIException(f"Error parsing AI response: {str(exc)}", status_code=500)

def build_dream_rag_graph(
    service: DreamRetrievalService | None = None,
    custom_key: str | None = None,
    selected_model: str | None = None,
    generation_function: Callable[..., dict[str, Any]] | None = None,
) -> Any:
    """Create a compiled LangGraph graph for augmented dream analysis."""
    generator = generation_function or _openrouter_generate

    def vectorize(state: DreamRagState) -> DreamRagState:
        """Generate a dense vector for the dream text using the remote provider.

        The vector is stored under ``dream_vector`` for downstream nodes that may
        need it. The original ``dream_text`` is also ensured in the state.
        """
        dream_text = state.get("dream_text") or extract_dream_text(
            state.get("entry_payload")
        )
        provider = EmbeddingProvider()
        dream_vector = provider.embed_query(dream_text)
        return {"dream_text": dream_text, "dream_vector": dream_vector}

    def retrieve(state: DreamRagState) -> DreamRagState:
        """Retrieve contextual passages from Qdrant based on the dream text.

        The function ignores the previously stored vector – the existing service
        operates on raw text, which remains valid. Keeping the signature unchanged
        preserves compatibility with existing tests.
        """
        dream_text = state.get("dream_text") or extract_dream_text(
            state.get("entry_payload")
        )
        contexts: list[str] = []
        retrieval_service = service
        if retrieval_service is None:
            try:
                retrieval_service = DreamRetrievalService()
            except Exception:
                retrieval_service = None
        if retrieval_service is not None:
            try:
                contexts = retrieval_service.retrieve_context(dream_text)
            except Exception:
                contexts = []
        return {"dream_text": dream_text, "contexts": contexts}

    def assemble(state: DreamRagState) -> DreamRagState:
        payload = dict(state.get("entry_payload") or {})
        payload["_rag_context"] = state.get("contexts") or []
        return {"entry_payload": payload, "contexts": state.get("contexts") or []}

    def generate(state: DreamRagState) -> DreamRagState:
        analysis = generator(
            state.get("entry_payload") or {},
            state.get("contexts") or [],
            state.get("custom_key", custom_key),
            state.get("selected_model", selected_model),
        )
        return {"analysis": analysis}

    graph = StateGraph(DreamRagState)
    graph.add_node("vectorize", vectorize)
    graph.add_node("retrieve", retrieve)
    graph.add_node("assemble", assemble)
    graph.add_node("generate", generate)
    graph.add_edge(START, "vectorize")
    graph.add_edge("vectorize", "retrieve")
    graph.add_edge("retrieve", "assemble")
    graph.add_edge("assemble", "generate")
    graph.add_edge("generate", END)
    return graph.compile()


def run_dream_rag_analysis(
    entry_payload: dict[str, Any],
    custom_key: str | None = None,
    model: str | None = None,
    service: Any = None,
    generation_function: Callable[..., dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Run end-to-end retrieval + generation through the RAG graph."""
    graph = build_dream_rag_graph(
        service=service,
        custom_key=custom_key,
        selected_model=model,
        generation_function=generation_function,
    )
    initial_state: DreamRagState = {
        "dream_text": extract_dream_text(entry_payload),
        "entry_payload": entry_payload,
        "custom_key": custom_key,
        "selected_model": model,
    }
    result = graph.invoke(initial_state)
    return result["analysis"]
