import os
import json
import requests
from api.utils import APIException
# Ensure .env variables are loaded when this module is imported (tests)
from dotenv import load_dotenv
from typing import Optional, List, Dict

load_dotenv()


def search_dream_concepts(sleep_text: str) -> List[str]:
    """Extract dream concepts using semantic similarity. Placeholder for Qdrant integration.

    Returns a list of identified concept strings.
    """
    return []


def run_unified_ai_analysis(entry_payload: Dict, custom_key: Optional[str] = None) -> Dict:
    """Orchestrate unified AI prompt to OpenRouter and parse JSON response."""
    # Retrieve the API key, ensuring it is a string for type checkers.
    # `os.getenv` returns `Optional[str]`; after the explicit check we can safely
    # treat it as `str`. The `assert` helps static analysis understand that the
    # value is not `None`.
    api_key = custom_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise APIException("AI provider API key is not configured", status_code=500)
    # At this point `api_key` is guaranteed to be a non‑empty string.
    assert isinstance(api_key, str)

    selected_model = "nvidia/nemotron-3.5-super-vl:free"
    url = "https://openrouter.ai/api/v1/chat/completions"

    system_prompt = (
        "You are an expert sleep hygiene and dream analysis assistant for Eusomnia. "
        "Analyze the provided daily log containing sleep narrative, habits and nutrition. "
        "Return the entire analysis in Spanish. Every human-readable value, including "
        "interpretation, emotions, symbols, habits, patterns, recommendations, and alerts, "
        "must be written in Spanish; do not leave English phrases untranslated. "
        "Keep the JSON keys exactly as specified and return "
        "ONLY a valid JSON object with keys: interpretation, predominant_emotions, "
        "detected_symbols, habits_reading, patterns_detected, recommendations, alerts."
    )

    try:
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": selected_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(entry_payload)}
                ],
                "response_format": {"type": "json_object"}
            },
            timeout=30
        )
        response.raise_for_status()
        raw_result = response.json()
        content = raw_result["choices"][0]["message"]["content"]
        return json.loads(content)
    except requests.exceptions.RequestException as e:
        raise APIException(f"Error querying AI provider: {str(e)}", status_code=502)
    except (KeyError, json.JSONDecodeError) as e:
        raise APIException(f"Error parsing AI response: {str(e)}", status_code=500)
