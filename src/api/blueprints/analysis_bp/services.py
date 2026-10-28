import json
import os

import requests

from api.services.qdrant_service import DreamRetrievalService
from api.services.rag_graph import run_dream_rag_analysis
from api.utils import APIException


def search_dream_concepts(sleep_text: str) -> list[str]:
    """Return retrieved dream-symbol context for a sleep narrative."""
    try:
        service = DreamRetrievalService()
        return service.retrieve_context(sleep_text)
    except Exception:
        return []


def run_unified_ai_analysis(
    entry_payload: dict, custom_key: str | None = None, model: str | None = None
) -> dict:
    """Orchestrate unified AI prompt using the LangGraph RAG graph."""
    return run_dream_rag_analysis(
        entry_payload=entry_payload,
        custom_key=custom_key,
        model=model,
    )
