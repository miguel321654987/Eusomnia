import os
import requests
from api.utils import APIException


def fetch_nutrition_data(query: str) -> dict:
    """Fetch nutritional metrics from CalorieNinjas API."""
    api_key = os.getenv("CALORIENINJAS_API_KEY")
    if not api_key:
        raise APIException(
            "CalorieNinjas API key is not configured on server", status_code=500)

    url = f"https://api.calorieninjas.com/v1/nutrition?query={query}"
    try:
        response = requests.get(
            url, headers={"X-Api-Key": api_key}, timeout=10)
        response.raise_for_status()
        data = response.json()

        items = data.get("items", [])
        total_calories = sum(item.get("calories", 0.0) for item in items)
        total_sugar = sum(item.get("sugar_g", 0.0) for item in items)
        total_sodium = sum(item.get("sodium_mg", 0.0) for item in items)

        return {
            "items": items,
            "total_calories": round(total_calories, 2),
            "total_sugar_g": round(total_sugar, 2),
            "total_sodium_mg": round(total_sodium, 2)
        }
    except requests.exceptions.RequestException as e:
        raise APIException(
            f"Error connecting to nutrition provider: {str(e)}", status_code=502)
