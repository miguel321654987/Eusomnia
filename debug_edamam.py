"""
Script de diagnóstico para verificar qué devuelve Edamam exactamente.
Ejecutar con: python debug_edamam.py
"""
import json
import os
import sys

# Cargar variables de entorno desde .env
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

print(f"APP_ID : {APP_ID}")
print(f"APP_KEY: {APP_KEY[:8]}..." if APP_KEY else "APP_KEY: MISSING")
print(f"BASE   : {BASE}")
print()

# ── TEST 1: GET /api/nutrition-data (ingrediente individual) ──────────────────
print("=" * 60)
print("TEST 1 — GET /api/nutrition-data (single ingredient)")
query = "150g chicken breast"
url   = f"{BASE}/api/nutrition-data"
resp  = requests.get(
    url,
    params={"app_id": APP_ID, "app_key": APP_KEY, "ingr": query, "nutrition-type": "logging"},
    timeout=15,
)
print(f"Status : {resp.status_code}")
try:
    data = resp.json()
    # Mostrar sólo las claves top-level y totalNutrients resumido
    keys = list(data.keys())
    print(f"Keys   : {keys}")
    print(f"calories      : {data.get('calories')}")
    print(f"totalWeight   : {data.get('totalWeight')}")
    tn = data.get("totalNutrients") or {}
    print(f"totalNutrients keys: {list(tn.keys())[:10]}")
    ingrs = data.get("ingredients") or []
    print(f"ingredients count: {len(ingrs)}")
    for i, ing in enumerate(ingrs[:2]):
        parsed = ing.get("parsed") or []
        print(f"  ingredient[{i}].parsed count: {len(parsed)}")
        for j, p in enumerate(parsed[:1]):
            print(f"    parsed[{j}] weight: {p.get('weight')}")
            nutrients = p.get("nutrients") or {}
            print(f"    parsed[{j}] nutrient keys: {list(nutrients.keys())[:8]}")
except Exception as e:
    print(f"Error parsing response: {e}")
    print(resp.text[:500])

print()

# ── TEST 2: POST /api/nutrition-details (recipe) ──────────────────────────────
print("=" * 60)
print("TEST 2 — POST /api/nutrition-details (recipe)")
url2     = f"{BASE}/api/nutrition-details"
payload  = {"title": "Lunch", "ingr": ["150g chicken breast", "100g rice", "1 apple"]}
resp2    = requests.post(
    url2,
    params={"app_id": APP_ID, "app_key": APP_KEY},
    json=payload,
    timeout=15,
)
print(f"Status : {resp2.status_code}")
try:
    data2 = resp2.json()
    keys2 = list(data2.keys())
    print(f"Keys   : {keys2}")
    print(f"calories      : {data2.get('calories')}")
    print(f"totalWeight   : {data2.get('totalWeight')}")
    tn2 = data2.get("totalNutrients") or {}
    print(f"totalNutrients keys: {list(tn2.keys())[:10]}")
    ingrs2 = data2.get("ingredients") or []
    print(f"ingredients count: {len(ingrs2)}")
    for i, ing in enumerate(ingrs2[:2]):
        parsed = ing.get("parsed") or []
        print(f"  ingredient[{i}].parsed count: {len(parsed)}")
        for j, p in enumerate(parsed[:1]):
            print(f"    parsed[{j}] weight: {p.get('weight')}")
            nutrients = p.get("nutrients") or {}
            print(f"    parsed[{j}] nutrient keys: {list(nutrients.keys())[:8]}")
    if "error" in data2:
        print(f"ERROR field: {data2['error']}")
except Exception as e:
    print(f"Error parsing response: {e}")
    print(resp2.text[:500])

print()
print("DONE")
