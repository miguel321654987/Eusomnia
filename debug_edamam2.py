"""
Test 2: simular exactamente lo que hace analyze_foods con múltiples comidas
y trazar qué devuelve aggregate_nutrients.
"""
import json, os, sys

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

import requests

APP_ID  = os.getenv("EDAMAM_APP_ID")
APP_KEY = os.getenv("EDAMAM_APP_KEY")
BASE    = os.getenv("EDAMAM_BASE_URL", "https://api.edamam.com").rstrip("/")

# ── Simular el payload que llega desde DailyLog.jsx al /api/nutrition/log ─────
# Antes del fix: con prefijos de tipo de comida
lines_before = [
    "Desayuno: 1 café con leche desnatada y tostada",
    "Comida: 150g lentejas con pollo",
    "Cena: salmón al horno con espinacas",
]
# Después del fix: texto limpio
lines_after = [
    "1 café con leche desnatada y tostada",
    "150g lentejas con pollo",
    "salmón al horno con espinacas",
]


def test_recipe(label, ingr_lines):
    print(f"\n{'='*60}")
    print(f"POST /api/nutrition-details — {label}")
    print(f"ingr: {ingr_lines}")
    url = f"{BASE}/api/nutrition-details"
    resp = requests.post(
        url,
        params={"app_id": APP_ID, "app_key": APP_KEY},
        json={"title": "Meal", "ingr": ingr_lines},
        timeout=15,
    )
    print(f"Status: {resp.status_code}")
    data = resp.json()
    if "error" in data:
        print(f"ERROR: {data['error']}")
        return

    print(f"calories     : {data.get('calories')}")
    print(f"totalWeight  : {data.get('totalWeight')}")
    tn = data.get("totalNutrients") or {}
    # Claves relevantes que busca aggregate_nutrients
    for code in ["ENERC_KCAL", "PROCNT", "CHOCDF", "SUGAR", "FAT", "NA", "TOCPHA", "VITB12"]:
        entry = tn.get(code)
        qty = entry.get("quantity") if isinstance(entry, dict) else None
        print(f"  {code}: {qty}")

    ingrs = data.get("ingredients") or []
    print(f"ingredients[]: {len(ingrs)} items")

    # Simular aggregate_nutrients
    totals = {}
    total_weight = 0.0
    for ingredient in ingrs:
        for parsed in ingredient.get("parsed") or []:
            total_weight += float(parsed.get("weight") or 0.0)
            for code, info in (parsed.get("nutrients") or {}).items():
                totals[code] = totals.get(code, 0.0) + float(info.get("quantity") or 0.0)

    print(f"\naggregate step1 (ingredients path) → totals empty? {not totals}")

    if not totals and isinstance(data.get("totalNutrients"), dict):
        total_weight = float(data.get("totalWeight") or 0.0)
        for code, info in data.get("totalNutrients", {}).items():
            if isinstance(info, dict):
                totals[code] = float(info.get("quantity") or 0.0)
        print(f"aggregate step2 (totalNutrients fallback) → ENERC_KCAL={totals.get('ENERC_KCAL')}")

    result = {
        "calories":        round(totals.get("ENERC_KCAL", 0.0), 2),
        "protein_g":       round(totals.get("PROCNT", 0.0), 2),
        "carbohydrates_g": round(totals.get("CHOCDF", 0.0), 2),
        "sugars_g":        round(totals.get("SUGAR", 0.0), 2),
        "fat_g":           round(totals.get("FAT", 0.0), 2),
        "sodium_mg":       round(totals.get("NA", 0.0), 2),
    }
    print(f"\nFINAL aggregate_nutrients result:")
    for k, v in result.items():
        print(f"  {k}: {v}")


test_recipe("BEFORE fix (with prefixes)", lines_before)
test_recipe("AFTER fix (clean lines)", lines_after)
