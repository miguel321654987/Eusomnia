"""Nutrition services: translation, Edamam integration and evaluation.

This module owns every external call of the nutrition blueprint: the
ES->EN translation required by the Edamam NLP, the recipe analysis POST
request, the aggregation of NTR nutrient codes and the evaluation of the
result against the reference parameters stored in
``src/config/nutrition_sleep_parameters.json``.
"""

import json
import os
import re
import threading
import unicodedata
from typing import Any, Literal, cast

import requests
from deep_translator import GoogleTranslator, MyMemoryTranslator

from api.utils import APIException

from .loader import load_sleep_params
from .schemas import (
    ExcitantsReport,
    MealDistribution,
    NormalizedNutrition,
    NutrientStatus,
)

_TIMEOUT_SECONDS = 15
_TRANSLATION_CACHE: dict[str, str] = {}
_TRANSLATION_CACHE_LOCK = threading.Lock()
_TRANSLATION_TIMEOUT_SECONDS = float(
    os.getenv("TRANSLATION_TIMEOUT_SECONDS", "5"))

# ---------------------------------------------------------------------------
# Fallback dictionaries (used only when the user does NOT report a value).
# Amounts are typical reference values per standard unit/100 g and are
# intentionally approximate: edit these mappings to tune the behaviour.
# Keys are matched accent-insensitively against both the original (ES) and
# the translated (EN) ingredient lines.
# ---------------------------------------------------------------------------
CAFFEINE_FALLBACK_MG: dict[str, float] = {
    "cafe": 95.0,
    "coffee": 95.0,
    "espresso": 63.0,
    "te": 45.0,
    "tea": 45.0,
    "te negro": 45.0,
    "black tea": 45.0,
    "te verde": 28.0,
    "green tea": 28.0,
    "yerba mate": 30.0,
    "mate": 30.0,
    "matcha": 60.0,
    "guarana": 50.0,
    "cola": 34.0,
    "refresco de cola": 34.0,
    "energy drink": 80.0,
    "bebida energetica": 80.0,
}

ALCOHOL_FALLBACK_G: dict[str, float] = {
    "vino": 14.0,
    "wine": 14.0,
    "cerveza": 14.0,
    "beer": 14.0,
    "sidra": 14.0,
    "cider": 14.0,
    "champan": 14.0,
    "champagne": 14.0,
    "vodka": 14.0,
    "ron": 14.0,
    "rum": 14.0,
    "whisky": 14.0,
    "whiskey": 14.0,
    "tequila": 14.0,
    "ginebra": 14.0,
    "gin": 14.0,
    "licor": 14.0,
    "liquor": 14.0,
    "destilado": 14.0,
    "spirits": 14.0,
}

OMEGA3_FALLBACK_MG_PER_100G: dict[str, float] = {
    "salmón": 1800.0,
    "salmon": 1800.0,
    "sardina": 1400.0,
    "sardines": 1400.0,
    "caballa": 1500.0,
    "mackerel": 1500.0,
    "arenque": 1500.0,
    "herring": 1500.0,
    "trucha": 1000.0,
    "trout": 1000.0,
    "atún": 1000.0,
    "atun": 1000.0,
    "tuna": 1000.0,
    "anchoa": 2000.0,
    "anchovy": 2000.0,
    "anchovies": 2000.0,
}

# Sleep-disrupting excitants without an official range (JSON: other_excitants).
# Presence -> negative effect; absence -> neutral effect.
EXCITANT_KEYWORDS: tuple[str, ...] = (
    "cafe", "coffee", "espresso", "te", "tes", "tea",
    "te verde", "green tea", "te negro", "black tea",
    "yerba mate", "mate", "matcha", "guarana",
    "cola", "refresco de cola", "energy drink", "bebida energetica",
)


def _effective_translation_timeout() -> float:
    """Return the active per-provider translation timeout.

    Prefer the dedicated translation timeout, but also honour the generic
    request timeout so either spelling used by callers or tests bounds a
    hanging translator.
    """
    candidates = []
    if isinstance(_TRANSLATION_TIMEOUT_SECONDS, (int, float)) and \
            _TRANSLATION_TIMEOUT_SECONDS > 0:
        candidates.append(float(_TRANSLATION_TIMEOUT_SECONDS))
    if isinstance(_TIMEOUT_SECONDS, (int, float)) and _TIMEOUT_SECONDS > 0:
        candidates.append(float(_TIMEOUT_SECONDS))
    if not candidates:
        return 5.0
    return min(candidates)


def _call_with_timeout(func, timeout_seconds: float):
    """Run ``func`` in a daemon thread bounded by ``timeout_seconds``.

    ``deep-translator`` does not expose an HTTP timeout, so the call is
    executed in a separate daemon thread. Returning after the timeout lets the
    caller fall back instead of hanging the whole nutrition request.
    """
    result: dict[str, Any] = {}
    error: dict[str, BaseException] = {}

    def worker() -> None:
        try:
            result["value"] = func()
        except BaseException as exc:  # noqa: BLE001 - propagated to caller
            error["exception"] = exc

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    thread.join(timeout=timeout_seconds)

    if thread.is_alive():
        raise TimeoutError(
            f"translation timed out after {timeout_seconds} seconds")

    if "exception" in error:
        raise error["exception"]

    return result.get("value")


def translate_text(text: str) -> str:  # pragma: no cover
    """Translate a Spanish ingredient line to English (cache + fallback).

    MyMemory is the primary provider because Google's free endpoint is
    blocked from datacenter IPs. Note that deep-translator's MyMemory
    dictionary keys are full language names ("spanish"/"english"), not
    ISO codes. If every provider fails, the original text is returned so
    Edamam still gets the chance to parse it.

    Every provider call is bounded by ``_TRANSLATION_TIMEOUT_SECONDS`` to
    avoid hanging the nutrition request when a translator endpoint stalls.
    """
    if not text or not text.strip():
        return text

    with _TRANSLATION_CACHE_LOCK:
        cached = _TRANSLATION_CACHE.get(text)
        if cached is not None:
            return cached

    translated: str | None = None

    try:
        raw_result = _call_with_timeout(
            lambda: MyMemoryTranslator(
                source="spanish", target="english").translate(text),
            _effective_translation_timeout(),
        )
        if isinstance(raw_result, list):
            translated = " ".join(raw_result)
        else:
            translated = raw_result
    except Exception:  # noqa: BLE001 - provider fallback chain
        translated = None

    if not translated:
        try:
            translated = _call_with_timeout(
                lambda: GoogleTranslator(
                    source="es", target="en").translate(text),
                _effective_translation_timeout(),
            )
        except Exception:  # noqa: BLE001 - provider fallback chain
            translated = None

    if not translated:
        return text

    with _TRANSLATION_CACHE_LOCK:
        if len(_TRANSLATION_CACHE) >= 1000:
            _TRANSLATION_CACHE.clear()
        _TRANSLATION_CACHE[text] = translated
    return translated


def get_edamam_credentials() -> tuple[str, str]:  # pragma: no cover
    """Read Edamam credentials from the environment."""
    app_id = os.getenv("EDAMAM_APP_ID")
    app_key = os.getenv("EDAMAM_APP_KEY")
    if not app_id or not app_key:
        raise APIException(
            "Edamam credentials are not configured on server",
            status_code=500,
        )
    return app_id, app_key


def fetch_edamam_recipe(
        title: str, ingredient_lines: list[str]) -> dict[str, Any]:  # pragma: no cover
    """Run the Full Recipe Analysis (POST /api/nutrition-details)."""
    app_id, app_key = get_edamam_credentials()
    base_url = os.getenv(
        "EDAMAM_BASE_URL", "https://api.edamam.com").rstrip("/")
    url = f"{base_url}/api/nutrition-details"
    payload = {"title": title or "Meal", "ingr": ingredient_lines}

    try:
        response = requests.post(
            url,
            params={"app_id": app_id, "app_key": app_key},
            json=payload,
            timeout=_TIMEOUT_SECONDS,
        )
    except requests.exceptions.RequestException as exc:
        raise APIException(
            f"Error connecting to nutrition provider: {str(exc)}",
            status_code=502,
        )

    # Parse the body FIRST: Edamam can return a non-200 status (e.g. 555)
    # together with a JSON error payload {"error": "low_quality"}.
    # Checking the body before the status code lets us surface the 422 that
    # triggers the per-ingredient fallback in analyze_foods, instead of a
    # generic 502 that bypasses it.
    try:
        data = response.json()
    except ValueError:
        data = None

    if isinstance(data, dict) and "error" in data:
        # Edamam rejects batches as non-200 responses with an error body.
        # ``low_quality`` becomes 422 to trigger the GET fallback; other
        # provider-reported errors stay generic 502 failures.
        status_code = 422 if data.get('error') == 'low_quality' else 502
        raise APIException(
            f"Nutrition provider could not analyze the food: {data.get('error')}",
            status_code=status_code,
        )

    if response.status_code != 200:
        raise APIException(
            f"Nutrition provider returned status {response.status_code}",
            status_code=502,
        )

    if data is None:
        raise APIException(
            "Nutrition provider returned an invalid response",
            status_code=502,
        )

    return data


def fetch_edamam_ingredient(query: str) -> dict[str, Any]:  # pragma: no cover
    """Parse a single ingredient line (GET /api/nutrition-data).

    The GET parser tolerates compound phrases without quantities that the
    recipe POST rejects with a low_quality error.
    """
    app_id, app_key = get_edamam_credentials()
    base_url = os.getenv(
        "EDAMAM_BASE_URL", "https://api.edamam.com").rstrip("/")
    url = f"{base_url}/api/nutrition-data"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "ingr": query,
        "nutrition-type": "logging",
    }

    try:
        response = requests.get(url, params=params, timeout=_TIMEOUT_SECONDS)
    except requests.exceptions.RequestException as exc:
        raise APIException(
            f"Error connecting to nutrition provider: {str(exc)}",
            status_code=502,
        )

    try:
        data = response.json()
    except ValueError:
        raise APIException(
            "Nutrition provider returned an invalid response",
            status_code=502,
        )

    if isinstance(data, dict) and "error" in data:
        raise APIException(
            f"Nutrition provider could not analyze the food: "
            f"{data.get('error')}",
            status_code=422,
        )

    if response.status_code != 200:
        raise APIException(
            f"Nutrition provider returned status {response.status_code}",
            status_code=502,
        )

    return data



def aggregate_nutrients(raw: dict[str, Any]) -> dict[str, float]:
    """Sum NTR nutrient codes across every parsed ingredient.

    The licensed plan does not return root-level ``totalNutrients`` or
    ``calories``, so totals are aggregated from
    ``ingredients[].parsed[].nutrients``.
    """
    totals: dict[str, float] = {}
    total_weight = 0.0

    for ingredient in raw.get("ingredients", []):
        for parsed in ingredient.get("parsed") or []:
            total_weight += float(parsed.get("weight") or 0.0)
            for code, info in (parsed.get("nutrients") or {}).items():
                totals[code] = totals.get(code, 0.0) + float(
                    info.get("quantity") or 0.0)

    # Edamam's single-item licensed response (typically GET) does not expose
    # ingredients[].parsed[]; it returns an aggregate in totalNutrients.
    if not totals and isinstance(raw.get("totalNutrients"), dict):
        total_weight = float(raw.get("totalWeight") or 0.0)
        for code, info in raw.get("totalNutrients", {}).items():
            if isinstance(info, dict):
                totals[code] = float(info.get("quantity") or 0.0)

    # Last resort for very small responses that only expose calories.
    if not totals and raw.get("calories") is not None:
        total_weight = float(raw.get("totalWeight") or 0.0)
        totals["ENERC_KCAL"] = float(raw.get("calories") or 0.0)

    return {
        "calories": round(totals.get("ENERC_KCAL", 0.0), 2),
        "protein_g": round(totals.get("PROCNT", 0.0), 2),
        "carbohydrates_g": round(totals.get("CHOCDF", 0.0), 2),
        "sugars_g": round(totals.get("SUGAR", 0.0), 2),
        "fat_g": round(totals.get("FAT", 0.0), 2),
        "sodium_mg": round(totals.get("NA", 0.0), 2),
        "vitamin_e_mg": round(totals.get("TOCPHA", 0.0), 2),
        "vitamin_b12_ug": round(totals.get("VITB12", 0.0), 2),
        "total_weight_g": round(total_weight, 2),
    }


def _normalize(text: str) -> str:
    """Lowercase and strip accents so ES/EN keywords match reliably."""
    decomposed = unicodedata.normalize("NFKD", text.lower())
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def _leading_quantity(line: str) -> float:
    """Return the quantity at the start of a line (default: 1)."""
    match = re.match(r"\s*(\d+(?:[.,]\d+)?)", line)
    if not match:
        return 1.0
    return float(match.group(1).replace(",", "."))


def _extract_grams(line: str) -> float:
    """Return the grams referenced in a line (default: 100 g serving)."""
    normalized = _normalize(line)
    kilos = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:kg|kilo)", normalized)
    if kilos:
        return float(kilos.group(1).replace(",", ".")) * 1000.0
    grams = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramos?)\b", normalized)
    if grams:
        return float(grams.group(1).replace(",", "."))
    return 100.0


def _match_keyword(line: str, mapping: dict[str, float]) -> float:
    """Return the typical value of the longest keyword found in the line.

    Word boundaries prevent false positives such as "mate" inside
    "tomate" and the optional trailing "s" covers plural forms such as
    "coffees" or "cafes". The first match by descending keyword length
    wins so "green tea" is preferred over "tea".
    """
    normalized = _normalize(line)
    for keyword in sorted(mapping, key=len, reverse=True):
        if re.search(rf"\b{re.escape(keyword)}s?\b", normalized):
            return mapping[keyword]
    return 0.0


def _scan_line(line: str, nutrient: str) -> float:
    """Typical fallback contribution of a single ingredient line."""
    if nutrient == "omega3_mg":
        per_100g = _match_keyword(line, OMEGA3_FALLBACK_MG_PER_100G)
        if not per_100g:
            return 0.0
        return round(_extract_grams(line) / 100.0 * per_100g, 2)

    if nutrient == "caffeine_mg":
        per_unit = _match_keyword(line, CAFFEINE_FALLBACK_MG)
    else:
        per_unit = _match_keyword(line, ALCOHOL_FALLBACK_G)
    if not per_unit:
        return 0.0
    return round(per_unit * _leading_quantity(line), 2)


def resolve_supplement_values(
        line_pairs: list[tuple[str, str]],
        manual: dict[str, float | None]) -> dict[str, float]:
    """Resolve caffeine/alcohol/omega-3: manual report wins, fallback after.

    Edamam does not return these three nutrients on the current plan, so a
    value reported by the user is authoritative and otherwise a typical
    value is estimated from the ingredient lines (ES first, then EN).
    """
    supplements: dict[str, float] = {}
    for nutrient in ("caffeine_mg", "alcohol_g", "omega3_mg"):
        reported = manual.get(nutrient)
        if reported is not None:
            supplements[nutrient] = round(float(reported), 2)
            continue

        total = 0.0
        for original, translated in line_pairs:
            matched = _scan_line(original, nutrient)
            if matched == 0.0:
                matched = _scan_line(translated, nutrient)
            total += matched
        supplements[nutrient] = round(total, 2)
    return supplements


def detect_excitants(line_pairs: list[tuple[str, str]]) -> bool:
    """True when any original or translated line contains an excitant.

    The optional trailing "s" accepts plural forms ("coffees", "teas").
    """
    for original, translated in line_pairs:
        for line in (original, translated):
            normalized = _normalize(line)
            if any(
                re.search(rf"\b{re.escape(keyword)}s?\b", normalized)
                for keyword in EXCITANT_KEYWORDS
            ):
                return True
    return False


def analyze_foods(
        title: str,
        ingredient_lines: list[str],
        meal_type: str | None,
        manual: dict[str, float | None],
) -> NormalizedNutrition:  # pragma: no cover
    """Translate, analyze with Edamam and build the normalized payload.

    A single ingredient line goes straight to the tolerant GET parser.
    Multiple lines use the recipe POST and, when Edamam rejects the batch
    with a low_quality error (422), each line is parsed individually with
    the GET endpoint and the ingredient lists are merged.
    """
    translated_lines = [translate_text(line) for line in ingredient_lines]
    line_pairs = list(zip(ingredient_lines, translated_lines))

    if len(translated_lines) == 1:
        raw = fetch_edamam_ingredient(translated_lines[0])
    else:
        try:
            raw = fetch_edamam_recipe(title, translated_lines)
        except APIException as exc:
            if exc.status_code != 422:
                raise
            # Per-ingredient fallback: parse each line individually with the
            # tolerant GET parser and merge the results.  Individual failures
            # are skipped so that one unrecognised ingredient does not discard
            # the nutritional data for the rest of the batch.
            merged: dict[str, Any] = {"ingredients": []}
            for line in translated_lines:
                try:
                    single = fetch_edamam_ingredient(line)
                except APIException:
                    # Skip ingredients that Edamam cannot parse.
                    continue
                single_ingredients = single.get("ingredients")
                if isinstance(single_ingredients, list) and single_ingredients:
                    merged["ingredients"].extend(single_ingredients)
                else:
                    # GET responses expose nutrients in totalNutrients (not in
                    # ingredients[].parsed[]), so we normalise the structure
                    # so that aggregate_nutrients can read it uniformly.
                    nutrients = single.get("totalNutrients")
                    if not isinstance(nutrients, dict):
                        nutrients = {}
                        if single.get("calories") is not None:
                            nutrients["ENERC_KCAL"] = {
                                "quantity": single.get("calories")
                            }
                    merged["ingredients"].append(
                        {
                            "parsed": [
                                {
                                    "weight": float(
                                        single.get("totalWeight") or 0.0
                                    ),
                                    "nutrients": nutrients,
                                }
                            ]
                        }
                    )
            raw = merged

    nutrients = aggregate_nutrients(raw)
    supplements = resolve_supplement_values(line_pairs, manual)

    return NormalizedNutrition(
        calories=nutrients["calories"],
        protein_g=nutrients["protein_g"],
        carbohydrates_g=nutrients["carbohydrates_g"],
        sugars_g=nutrients["sugars_g"],
        fat_g=nutrients["fat_g"],
        sodium_mg=nutrients["sodium_mg"],
        caffeine_mg=supplements["caffeine_mg"],
        alcohol_g=supplements["alcohol_g"],
        omega3_mg=supplements["omega3_mg"],
        vitamin_e_mg=nutrients["vitamin_e_mg"],
        vitamin_b12_ug=nutrients["vitamin_b12_ug"],
        total_weight_g=nutrients["total_weight_g"],
        meal_type=meal_type,
        other_excitants_present=detect_excitants(line_pairs),
        raw_response=json.dumps(raw, ensure_ascii=False),
    )


def _classify_value(
        value: float | None,
        min_ref: float | None,
        max_ref: float | None,
) -> Literal["below", "within", "above", "no_reference"]:
    """Classify a value against its reference range (JSON semantics)."""
    if value is None or (min_ref is None and max_ref is None):
        return "no_reference"
    if min_ref is not None and value < min_ref:
        return "below"
    if max_ref is not None and value > max_ref:
        return "above"
    return "within"


def _resolve_range(
        spec: dict[str, Any],
        weight_kg: float | None) -> tuple[float | None, float | None]:
    """Resolve min/max refs, evaluating calc_min/calc_max for protein."""
    min_ref = spec.get("min_ref")
    max_ref = spec.get("max_ref")
    calc_min = spec.get("calc_min")
    calc_max = spec.get("calc_max")
    if calc_min and calc_max:
        if weight_kg is None:
            return None, None
        # Expressions come from the project-owned JSON config; restricted
        # globals keep the evaluation free of ambient builtins.
        scope = {"weight_kg": weight_kg}
        min_ref = round(float(eval(calc_min, {"__builtins__": {}}, scope)), 2)
        max_ref = round(float(eval(calc_max, {"__builtins__": {}}, scope)), 2)
    return min_ref, max_ref


def evaluate_nutrition(
        values: dict[str, Any],
        weight_kg: float | None) -> dict[str, Any]:
    """Evaluate stored nutrition values against the JSON parameters.

    Implements the reference ranges of ``nutrition_sleep_parameters.json``
    (caffeine 0-200 mg, alcohol 0-14 g, omega-3 250-500 mg, ...) plus the
    per-meal distribution rules and the presence-based excitants report.
    """
    params = load_sleep_params()
    statuses: list[NutrientStatus] = []

    for nutrient_key, spec in params["nutrients"].items():
        if nutrient_key == "other_excitants":
            continue
        min_ref, max_ref = _resolve_range(spec, weight_kg)
        value = values.get(nutrient_key)
        # Cast the result of _classify_value to the expected Literal type to satisfy static type checking.
        statuses.append(NutrientStatus(
            nutrient=nutrient_key,
            unit=spec.get("unit"),
            value=None if value is None else round(float(value), 2),
            min_ref=min_ref,
            max_ref=max_ref,
            status=cast(Literal["below", "within", "above", "no_reference"],
                         _classify_value(value, min_ref, max_ref)),
        ))

    present = bool(values.get("other_excitants_present"))
    excitants = ExcitantsReport(
        present=present,
        effect="negative" if present else "neutral",
    )

    meals = params["meals"]
    total_factor = sum(
        meal_spec["weight_factor"] for meal_spec in meals.values())
    distributed_fields = (
        "protein_g",
        "carbohydrates_g",
        "sugars_g",
        "caffeine_mg",
        "alcohol_g",
    )
    distribution: list[MealDistribution] = []
    for meal_name, meal_spec in meals.items():
        share = meal_spec["weight_factor"] / total_factor
        distribution.append(MealDistribution(
            meal_type=meal_name,
            weight_factor=meal_spec["weight_factor"],
            share=round(share, 4),
            values={
                field: round(
                    float(values.get(field) or 0.0) * share, 2)
                for field in distributed_fields
            },
        ))

    return {
        "nutrient_statuses": statuses,
        "excitants": excitants,
        "meal_distribution": distribution,
    }




