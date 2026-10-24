"""Embedding provider wrapper for remote OpenRouter embeddings.

This module defines a thin wrapper around ``langchain_openai.OpenAIEmbeddings``
configured to use the OpenRouter endpoint. The wrapper isolates the embedding
logic so that it can be reused from the LangGraph ``vectorize`` node and any
stand‑alone scripts (e.g., the CSV seeding script).

Environment variables:
    OPENROUTER_API_KEY   – API key for OpenRouter (required at runtime).
    OPENROUTER_BASE_URL  – Base URL for the OpenRouter API (defaults to the
                            official endpoint).
    EMBEDDING_MODEL      – Model identifier for embeddings (defaults to
                            ``openai/text-embedding-3-small``).
"""

from __future__ import annotations

import os
from typing import List

try:
    from langchain_openai import OpenAIEmbeddings
except ImportError as exc:
    raise ImportError(
        "langchain_openai is required for EmbeddingProvider. Install the "
        "'langchain-openai' package."
    ) from exc


class EmbeddingProvider:
    """Thin client that produces dense embedding vectors via OpenRouter.

    The class lazily creates an ``OpenAIEmbeddings`` instance configured with
    the appropriate base URL and API key. The public ``embed_query`` method
    returns a list of floats suitable for Qdrant operations.
    """

    def __init__(self) -> None:
        self.model = os.getenv("EMBEDDING_MODEL", "openai/text-embedding-3-small")
        self.base_url = os.getenv(
            "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
        )
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is not set")

        # Initialise the LangChain embeddings client.
        self._embeddings = OpenAIEmbeddings(
            model=self.model,
            base_url=self.base_url,
            api_key=self.api_key,
            # Disable context‑length validation – the remote service will handle it.
            check_embedding_ctx_length=False,
        )

    def embed_query(self, text: str) -> List[float]:
        """Return the embedding vector for *text*.

        The underlying ``OpenAIEmbeddings`` returns a NumPy array; we convert it
        to a plain Python list for JSON‑serialisable compatibility.
        """
        vector = self._embeddings.embed_query(text)
        return list(vector)
