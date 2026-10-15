import os
import json
import requests
from api.utils import APIException


def search_dream_concepts(sleep_text: str) -> list:
    """Extract dream concepts using semantic similarity. Placeholder for Qdrant integration."""
    return []


def run_unified_ai_analysis(entry_payload: dict, custom_key: str = None, model: str = None) -> dict:
    """Orchestrate unified AI prompt to OpenRouter and parse JSON response."""
    api_key = custom_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise APIException("AI provider API key is not configured", status_code=500)

    selected_model = model or os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    url = "https://openrouter.ai/api/v1/chat/completions"

    system_prompt = (
        "You are an expert sleep hygiene and dream analysis assistant for Eusomnia. "
        "Analyze the provided daily log containing sleep narrative, habits and nutrition. "
        "Return ONLY a valid JSON object with keys: interpretation, predominant_emotions, "
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

