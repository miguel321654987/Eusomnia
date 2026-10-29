import json
import os
from typing import Any, Dict, List, Optional, Tuple, Union

import requests

from api.utils import APIException


OPENROUTER_MODEL = "nvidia/nemotron-3.5-super-vl:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
NON_TRANSLATABLE_KEYS = {
    "uri",
    "url",
    "image",
    "imageUrl",
    "foodId",
    "measureURI",
    "unit",
}
JsonPathPart = Union[str, int]


def translate_texts(
    texts: List[str],
    target_language: str,
    custom_key: Optional[str] = None,
) -> List[str]:
    if not texts:
        return []

    api_key = custom_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise APIException(
            "No hay una clave de OpenRouter configurada para traducir.",
            status_code=500,
        )

    system_prompt = (
        "Translate every string in the provided JSON array into "
        f"{target_language}. Translate all natural-language text, including "
        "food names and descriptions. Preserve numbers, quantities, units, "
        "and line breaks. If a string is already in the target language, keep "
        "it unchanged. Return only a JSON object with a 'translations' array "
        "containing exactly one translated string for each input string."
    )
    response = None
    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": os.getenv("OPENROUTER_MODEL", OPENROUTER_MODEL),
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(texts, ensure_ascii=False)},
                ],
                "response_format": {"type": "json_object"},
            },
            timeout=30,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        translations = json.loads(content)["translations"]
        if (
            not isinstance(translations, list)
            or len(translations) != len(texts)
            or not all(isinstance(item, str) and item.strip() for item in translations)
        ):
            raise APIException(
                "OpenRouter devolvió una traducción incompleta.",
                status_code=502,
            )
        return translations
    except requests.exceptions.HTTPError:
        status_code = response.status_code if response is not None else "desconocido"
        raise APIException(
            f"OpenRouter rechazó la traducción (HTTP {status_code}).",
            status_code=502,
        ) from None
    except requests.exceptions.RequestException as error:
        raise APIException(
            f"No se pudo conectar con OpenRouter para traducir "
            f"({type(error).__name__}).",
            status_code=502,
        ) from None
    except (IndexError, KeyError, json.JSONDecodeError, TypeError) as error:
        raise APIException(
            f"OpenRouter devolvió una respuesta de traducción inválida: "
            f"{type(error).__name__}.",
            status_code=502,
        ) from None


def translate_edamam_response(
    data: Dict[str, Any],
    custom_key: Optional[str] = None,
) -> Dict[str, Any]:
    translation_paths: List[Tuple[List[JsonPathPart], str]] = []

    def collect_strings(value: Any, path: List[JsonPathPart]) -> None:
        if isinstance(value, dict):
            for key, nested_value in value.items():
                if key not in NON_TRANSLATABLE_KEYS:
                    collect_strings(nested_value, [*path, key])
        elif isinstance(value, list):
            for index, nested_value in enumerate(value):
                collect_strings(nested_value, [*path, index])
        elif isinstance(value, str) and value.strip():
            translation_paths.append((path, value))

    collect_strings(data, [])
    translations = translate_texts(
        [text for _, text in translation_paths],
        target_language="Spanish",
        custom_key=custom_key,
    )

    for (path, _), translated_text in zip(translation_paths, translations):
        current_value = data
        for path_part in path[:-1]:
            current_value = current_value[path_part]
        current_value[path[-1]] = translated_text

    return data
