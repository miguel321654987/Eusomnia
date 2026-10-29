"""LangGraph orchestration for Eusomnia's dream-analysis RAG flow."""

from __future__ import annotations

import json
import os
import logging
import re
import time
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
    dream_vector: list[float]
    openrouter_error: bool | None


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
        raise APIException(
            "AI provider API key is not configured", status_code=500)

    # Seleccionamos el modelo de OpenRouter. El valor por defecto es el router gratuito
    # "openrouter/free", que delega al modelo libre disponible. Puede sobrescribirse
    # mediante la variable de entorno OPENROUTER_MODEL o pasando explícitamente el
    # parámetro `model`.
    selected_model = (
        model
        or os.getenv("OPENROUTER_MODEL")
        or "nvidia/nemotron-3.5-super-vl:free"
    )
    profile_preferences = (entry_payload or {}).get("_profile_preferences") or {}
    framework_guidance = {
        "jungian": (
            "Use a Jungian-inspired reflective lens, considering symbols and "
            "archetypes as exploratory possibilities rather than objective facts."
        ),
        "neuroscientific": (
            "Use a neuroscience-informed lens focused on sleep, memory, emotion, "
            "and habits; avoid claiming that a dream reveals a medical condition."
        ),
        "holistic": (
            "Use a holistic reflective lens connecting reported habits, emotions, "
            "and personal meaning without presenting speculation as fact."
        ),
    }
    depth_guidance = {
        "concise": "Keep the interpretation concise and limit it to one paragraph.",
        "standard": "Give a balanced interpretation with moderate detail.",
        "clinical": (
            "Give a detailed, structured interpretation while avoiding diagnoses "
            "or treatment claims."
        ),
    }
    framework = profile_preferences.get("interpretation_framework", "jungian")
    report_depth = profile_preferences.get("report_depth", "standard")
    enriched_payload = dict(entry_payload or {})
    enriched_payload.pop("_profile_preferences", None)
    if contexts:
        enriched_payload["_rag_context"] = contexts

    # NOTE: The system prompt remains in English for clarity to the model, but we explicitly
    # instruct the model to respond **solely in Spanish**. This guarantees that the JSON values
    # are always in the UI language, avoiding intermittent English output.
    system_prompt = (
        "You are an expert sleep hygiene and dream analysis assistant for Eusomnia. "
        "Analyze the provided daily log containing sleep narrative, habits and nutrition. "
        "Return the entire analysis in Spanish. Every human-readable value, including "
        "interpretation, emotions, symbols, habits, patterns, recommendations, and alerts, "
        "must be written in Spanish; do not leave English phrases untranslated. "
        "Keep the JSON keys exactly as specified and return only a valid JSON object with "
        "keys: interpretation, predominant_emotions, detected_symbols, habits_reading, "
        "patterns_detected, recommendations, alerts. "
        f"{framework_guidance.get(framework, framework_guidance['jungian'])} "
        f"{depth_guidance.get(report_depth, depth_guidance['standard'])}"
    )
    # ---------------------------------------------------------------------
    # Configuración de logging (se usará en todo el módulo)
    # ---------------------------------------------------------------------
    logger = logging.getLogger(__name__)

    # Cabeceras opcionales que OpenRouter puede requerir
    # ---------------------------------------------------------------------
    extra_headers: dict[str, str] = {}
    referer = os.getenv("OPENROUTER_REFERER")
    title = os.getenv("OPENROUTER_TITLE")
    if referer:
        extra_headers["Referer"] = referer
    if title:
        extra_headers["X-Title"] = title

    # ---------------------------------------------------------------------
    # Lista de modelos gratuitos de OpenRouter, ordenados de mayor a menor capacidad.
    # Se permite sobrescribir mediante la variable de entorno OPENROUTER_MODEL o
    # pasando explícitamente el parámetro `model`.
    # ---------------------------------------------------------------------
    fallback_models = [selected_model]

    def _call_model(model_name: str, use_format: bool) -> dict:
        """Realiza la llamada a OpenRouter para *model_name*.

        Si ``use_format`` es ``True`` se envía ``response_format`` para que la API
        devuelva JSON directamente. En caso de error se intentará nuevamente sin
        ese formato y, si sigue fallando, se propagará la excepción para que el bucle
        de fallback pruebe el siguiente modelo.
        """
        payload: dict[str, Any] = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(enriched_payload)},
            ],
        }
        if use_format:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        headers.update(extra_headers)

        # Reintentos exponenciales (máx. 3 intentos)
        for attempt in range(3):
            try:
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30,
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if use_format:
                    # Cuando el formato está activado, la respuesta ya es JSON.
                    return json.loads(content)
                # Sin formato: intentar extraer un bloque JSON del texto.
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    json_match = re.search(r"\{.*\}", content, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                    raise APIException(
                        f"Unable to parse JSON from OpenRouter response for model {model_name}",
                        status_code=502,
                    )
            except Exception as exc:  # Catch any error, including generic exceptions from mocks
                if attempt == 2:
                    raise APIException(
                        f"OpenRouter request failed for model {model_name}: {exc}",
                        status_code=502,
                    )
                backoff = 2 ** attempt
                logger.warning(
                    "Retry %s for model %s after %s seconds due to %s",
                    attempt + 1,
                    model_name,
                    backoff,
                    exc,
                )
                time.sleep(backoff)
        # Si agotamos los reintentos sin éxito, lanzar una excepción genérica.
        raise APIException(
            f"All retries failed for OpenRouter model {model_name}", status_code=502
        )

    # ---------------------------------------------------------------------
    # Bucle principal que intenta cada modelo con y sin ``response_format``.
    # ---------------------------------------------------------------------
    for model_name in fallback_models:
        logger.info("Attempting OpenRouter model: %s", model_name)
        try:
            return _call_model(model_name, use_format=True)
        except Exception as err_fmt:  # noqa: BLE001
            logger.warning(
                "Model %s failed with response_format: %s. Retrying without format.",
                model_name,
                err_fmt,
            )
            try:
                return _call_model(model_name, use_format=False)
            except Exception as err_no_fmt:  # noqa: BLE001
                logger.warning(
                    "Model %s failed without response_format: %s. Continuing fallback.",
                    model_name,
                    err_no_fmt,
                )
                continue

    # Si llegamos aquí, todos los modelos fallaron.
    logger.error("All OpenRouter model attempts failed.")
    return {"openrouter_error": True}
    if referer:
        extra_headers["Referer"] = referer
    if title:
        extra_headers["X-Title"] = title

    # ---------------------------------------------------------------------
    # Lista de modelos free de OpenRouter ordenados de mayor a menor capacidad
    # ---------------------------------------------------------------------
    fallback_models = [
        "nvidia/nemotron-3.5-super-vl:free",
        "nvidia/nemotron-3.5-lightning:free",
        "nvidia/nemotron-3-ultra:free",
        "nvidia/nemotron-3-nano-omni:free",
        "nvidia/lama-nemotron-rerank-vl-1b-v2:free",
        "nvidia/nemotron-3.5-content-safety:free",
        "nvidia/nemotron-3-embed-1b:free",
        "nvidia/llama-nemotron-embed-vl-1b-v2:free",
        "inception/mercury-decide:free",
        "respan/span-01-lite:free",
        "liquidai/lfm2.5-embedding-350m:free",
        "liquidai/lfm2.5-2.6b:free",
        "thinkingmachines/inkling-small:free",
        "fish-audio/s2.1-pro-free:free",
        "poolside/laguna-s-2.1:free",
        "thinkingmachines/inkling:free",
        "poolside/laguna-xs-2.1:free",
        "cohere/north-mini-code:free",
        "google/gemma-4-26b-a4b:free",
        "google/gemma-4-31b:free",
        "nvidia/nemotron-3-super:free",
        "nvidia/nemotron-3-nano-omni:free",
    ]

    # Si se especificó un modelo explícito, darle prioridad
    if selected_model:
        if selected_model not in fallback_models:
            fallback_models.insert(0, selected_model)
        else:
            fallback_models.remove(selected_model)
            fallback_models.insert(0, selected_model)

    # ---------------------------------------------------------------------
    # Función interna que realiza la petición al modelo seleccionado.
    # ---------------------------------------------------------------------
    def _call_model(model_name: str, use_format: bool) -> dict:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(enriched_payload)},
            ],
        }
        if use_format:
            payload["response_format"] = {"type": "json_object"}

    # ---------------------------------------------------------------------
    # Bucle principal que intenta cada modelo con formato, y si falla, sin él.
    # ---------------------------------------------------------------------
    for model_name in fallback_models:
        logger.info("Intentando modelo OpenRouter: %s", model_name)
        try:
            return _call_model(model_name, use_format=True)
        except Exception:
            # intentar sin response_format
            try:
                raw = _call_model(model_name, use_format=False)
                if isinstance(raw, dict):
                    return raw
                if isinstance(raw, str):
                    match = re.search(
                        r"```json\s*(\{.*?\})\s*```", raw, re.DOTALL)
                    if not match:
                        match = re.search(r"(\{.*\})", raw, re.DOTALL)
                    if match:
                        return json.loads(match.group(1))
            except Exception as e2:
                logger.error(
                    "Falló modelo %s (con y sin response_format): %s", model_name, e2
                )
                continue

    raise APIException(
        "All OpenRouter model attempts failed. Check API key, quota, and model compatibility.",
        status_code=502,
    )

    # Si el usuario definió un modelo explícito mediante la variable de entorno
    # o pasó el argumento `model`, lo colocamos al frente de la lista para que
    # tenga prioridad.
    if selected_model and selected_model not in fallback_models:
        fallback_models.insert(0, selected_model)
    elif selected_model:
        # Si está ya en la lista, lo movemos al principio
        fallback_models.remove(selected_model)
        fallback_models.insert(0, selected_model)

    # Cabeceras opcionales que OpenRouter puede requerir
    extra_headers = {}
    referer = os.getenv("OPENROUTER_REFERER")
    title = os.getenv("OPENROUTER_TITLE")
    if referer:
        extra_headers["Referer"] = referer
    if title:
        extra_headers["X-Title"] = title

    # ---------------------------------------------------------------------
    # Función interna para intentar una llamada con/ sin response_format.
    # ---------------------------------------------------------------------
    def _call_model(model_name: str, use_format: bool) -> dict:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(enriched_payload)},
            ],
        }
        if use_format:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        headers.update(extra_headers)

        # Reintentos exponenciales (máx. 3 intentos)
        for attempt in range(3):
            try:
                resp = requests.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=30,
                )
                resp.raise_for_status()
                # Intentamos parsear como JSON directamente
                return resp.json()
            except requests.HTTPError as http_err:
                # Si el código indica que el formato no es soportado, rompemos
                if resp.status_code in {400, 422, 415} and use_format:
                    logger.warning(
                        "Model %s no soporta response_format, cambiando a fallback",
                        model_name,
                    )
                    raise
                # En otro caso, reintentamos con back‑off
                logger.error(
                    "HTTP error on attempt %s for model %s: %s (status %s)",
                    attempt + 1,
                    model_name,
                    http_err,
                    resp.status_code,
                )
                if attempt == 2:
                    raise
                time.sleep(2 ** attempt)
            except (requests.RequestException, json.JSONDecodeError) as exc:
                logger.error(
                    "Request error on attempt %s for model %s: %s", attempt + 1, model_name, exc
                )
                if attempt == 2:
                    raise
                time.sleep(2 ** attempt)

    # ---------------------------------------------------------------------
    # Bucle principal: probamos cada modelo con response_format, y si falla
    # intentamos sin él y extraemos JSON manualmente.
    # ---------------------------------------------------------------------
    for model_name in fallback_models:
        logger.info("Attempting OpenRouter model: %s", model_name)
        try:
            # Primero con response_format (JSON estructurado)
            return _call_model(model_name, use_format=True)
        except Exception as first_err:
            # Si el error indica incompatibilidad con response_format, probamos sin él
            try:
                raw_response = None
                # Llamada sin response_format
                raw_response = _call_model(model_name, use_format=False)
                # Si la respuesta ya es un dict, la devolvemos directamente
                if isinstance(raw_response, dict):
                    return raw_response
                # Caso contrario, intentamos extraer JSON del texto
                if isinstance(raw_response, str):
                    match = re.search(
                        r"```json\s*(\{.*?\})\s*```", raw_response, re.DOTALL)
                    if not match:
                        match = re.search(r"(\{.*\})", raw_response, re.DOTALL)
                    if match:
                        return json.loads(match.group(1))
                # Si llega aquí, el fallback también falló; continuamos con el siguiente modelo
                logger.warning(
                    "Fallback extraction failed for model %s, moving to next model.",
                    model_name,
                )
            except Exception as second_err:
                logger.error(
                    "Both attempts failed for model %s: first_err=%s, second_err=%s",
                    model_name,
                    first_err,
                    second_err,
                )
                # Pasamos al siguiente modelo de la lista
                continue

    # Si agotamos todos los modelos, lanzamos una excepción genérica
    raise APIException(
        "All OpenRouter model attempts failed. Check API key, quota, and model compatibility.",
        status_code=502,
    )


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
        # La generación puede devolver un dict con la clave especial
        # ``openrouter_error`` cuando todos los modelos fallan.
        gen_result = generator(
            state.get("entry_payload") or {},
            state.get("contexts") or [],
            state.get("custom_key", custom_key),
            state.get("selected_model", selected_model),
        )
        # Separar la señal de error del análisis real.
        openrouter_error = bool(gen_result.pop("openrouter_error", False))
        return {"analysis": gen_result, "openrouter_error": openrouter_error}

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
    # ``result`` ahora contiene ``analysis`` y opcionalmente ``openrouter_error``.
    analysis = result.get("analysis", {})
    if result.get("openrouter_error"):
        # Propagar la señal de error al llamador para que la capa superior pueda
        # incluirla en la respuesta JSON.
        analysis["openrouter_error"] = True
    return analysis
