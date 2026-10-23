"""Services for semantic retrieval from a Qdrant dream dictionary.

The module exposes :class:`DreamRetrievalService`, the project's Qdrant ingestion
and query helper.  It uses LangChain ``OpenAIEmbeddings`` with an
OpenAI-compatible endpoint (OpenRouter by default).
"""

from __future__ import annotations

import csv
import os
from typing import Any, Callable, Mapping, Sequence, cast

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

try:
    from langchain_openai import OpenAIEmbeddings
except ImportError:
    OpenAIEmbeddings = None
from pydantic import SecretStr


class DreamRetrievalService:
    """Ingest and query dream dictionary embeddings in Qdrant."""

    def __init__(self, collection_name=None, client=None, embeddings=None):
        self.collection_name = collection_name or os.getenv(
            "QDRANT_COLLECTION", "dream_dictionary"
        )
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY") or None

        if client is not None:
            self.client = client
        elif self.qdrant_api_key:
            self.client = QdrantClient(
                url=self.qdrant_url, api_key=self.qdrant_api_key,
                check_compatibility=False,
            )
        else:
            self.client = QdrantClient(
                url=self.qdrant_url, check_compatibility=False
            )

        if embeddings is not None:
            self.embeddings = embeddings
        elif OpenAIEmbeddings is not None:
            openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
            self.embeddings = OpenAIEmbeddings(
                model=os.getenv("EMBEDDING_MODEL", "openai/text-embedding-3-small"),
                base_url=os.getenv(
                    "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
                ),
                api_key=SecretStr(openrouter_api_key)
                if openrouter_api_key
                else None,
                check_embedding_ctx_length=False,
            )
        else:
            self.embeddings = None

    def encode_dream(self, dream_text):
        """Convert a dream to a dense embedding vector."""
        try:
            if self.embeddings is None:
                raise RuntimeError("OpenAIEmbeddings is not available")
            vector = self.embeddings.embed_query(dream_text)
            return list(vector)
        except Exception as exc:
            raise ValueError(f"Failed to encode dream text: {exc}") from exc

    encode = encode_dream
    embed_text = encode_dream

    def ensure_collection(self, vector_size):
        """Ensure the configured Qdrant collection exists."""
        exists = False
        try:
            exists = bool(
                self.client.collection_exists(collection_name=self.collection_name)
            )
        except AttributeError:
            try:
                self.client.get_collection(collection_name=self.collection_name)
                exists = True
            except Exception:
                exists = False
        except Exception:
            exists = False

        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=vector_size, distance=Distance.COSINE
                ),
            )
    # csv imported lazily below? keep stdlib import.

    def _records_to_documents(self, records):
        texts = []
        metadatas = []
        for record in records:
            record = dict(record)
            text = (
                record.get("interpretation_text")
                or record.get("text")
                or record.get("document")
                or ""
            )
            text = str(text).strip()
            if not text:
                continue

            metadata = {
                key: value
                for key, value in record.items()
                if key not in {"text", "interpretation_text", "document"}
            }
            metadata.setdefault("interpretation_text", text)
            texts.append(text)
            metadatas.append(metadata)
        return texts, metadatas

    def ingest_documents(self, records, batch_size=64):
        """Ingest dream symbol records into Qdrant."""
        texts, metadatas = self._records_to_documents(records)
        if not texts:
            return 0

        points_count = 0
        for start in range(0, len(texts), batch_size):
            batch_texts = texts[start : start + batch_size]
            batch_metadatas = metadatas[start : start + batch_size]
            embeddings = self.embeddings
            if embeddings is None:
                raise RuntimeError("OpenAIEmbeddings is not available")
            vectors = embeddings.embed_documents(batch_texts)

            points = []
            for offset, (vector, metadata) in enumerate(
                zip(vectors, batch_metadatas)
            ):
                point_id = metadata.get("id", start + offset)
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=list(vector),
                        payload=metadata,
                    )
                )
            if vectors:
                self.ensure_collection(len(vectors[0]))
            self.client.upsert(
                collection_name=self.collection_name, points=points
            )
            points_count += len(points)
        return points_count

    ingest = ingest_documents
    upsert_documents = ingest_documents
    ingest_dream_concepts = ingest_documents

    def ingest_from_csv(self, csv_path, text_column="interpretation_text", id_column="id"):
        import csv

        records = []
        with open(csv_path, newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            for index, row in enumerate(reader):
                record = dict(row)
                record.setdefault(
                    "interpretation_text", record.get(text_column, "")
                )
                if id_column and id_column not in record:
                    record["id"] = index
                records.append(record)
        return self.ingest_documents(records)

    def _search(self, dream_text, top_k):
        query_vector = self.encode_dream(dream_text)
        limit = max(1, int(top_k))
        try:
            search = getattr(self.client, "search", None)
            if callable(search):
                search_fn = cast(Callable[..., Any], search)
                return list(
                    cast(
                        Sequence[Any],
                        search_fn(
                            collection_name=self.collection_name,
                            query_vector=query_vector,
                            limit=limit,
                            with_payload=True,
                        ),
                    )
                )

            query_points = getattr(self.client, "query_points", None)
            if not callable(query_points):
                raise AttributeError("Qdrant client has no search or query_points method")
            query_points_fn = cast(Callable[..., Any], query_points)
            response = query_points_fn(
                collection_name=self.collection_name,
                query=query_vector,
                limit=limit,
                with_payload=True,
            )
            points = getattr(response, "points", None)
            if points is None:
                points = response
            return list(cast(Sequence[Any], points))
        except Exception as exc:
            raise ConnectionError(
                f"Qdrant retrieval failed: {exc}"
            ) from exc

    def _point_payload(self, point):
        payload = getattr(point, "payload", None)
        if payload is None and isinstance(point, Mapping):
            payload = point.get("payload")
        return dict(payload or {})

    def retrieve_context(self, dream_text, top_k=2):
        contexts = []
        for point in self._search(dream_text, top_k):
            payload = self._point_payload(point)
            payload_text = payload.get("interpretation_text")
            if payload_text:
                contexts.append(str(payload_text))
        return contexts

    def search_dream_concepts(self, dream_text, top_k=5):
        results = []
        for point in self._search(dream_text, top_k):
            payload = self._point_payload(point)
            item = {
                "id": getattr(point, "id", None),
                "score": getattr(point, "score", None),
                "payload": payload,
            }
            if "interpretation_text" in payload:
                item["interpretation_text"] = payload["interpretation_text"]
            results.append(item)
        return results

