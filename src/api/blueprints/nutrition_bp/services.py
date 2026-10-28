import os
import requests
from api.utils import APIException


def fetch_nutrition_data(query: str) -> dict:
    """Fetch nutrition details from the Edamam Nutrition Analysis API."""
    app_id = os.getenv("EDAMAM_APP_ID")
    app_key = os.getenv("EDAMAM_APP_KEY")
    if not app_id or not app_key:
        raise APIException(
            "Edamam credentials are not configured on server", status_code=500)

    base_url = os.getenv("EDAMAM_BASE_URL", "https://api.edamam.com").rstrip("/")
    url = f"{base_url}/api/nutrition-details"
    try:
        response = requests.post(
            url,
            params={
                "app_id": app_id,
                "app_key": app_key,
                "nutrition-type": "cooking",
            },
            json={"ingr": [query]},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        nutrients = data.get("totalNutrients", {})

        def nutrient_quantity(nutrient_id):
            nutrient = nutrients.get(nutrient_id)
            if not nutrient:
                return None
            return round(nutrient["quantity"], 2)

        return {
            "calories": round(data["calories"], 2),
            "fats_g": nutrient_quantity("FAT"),
            "protein_g": nutrient_quantity("PROCNT"),
            "carbs_g": nutrient_quantity("CHOCDF"),
            "sugar_g": nutrient_quantity("SUGAR"),
            "sodium_mg": nutrient_quantity("NA"),
            "caffeine_mg": nutrient_quantity("CAFFN"),
            "vitamin_b12_mcg": nutrient_quantity("VITB12"),
            "vitamin_e_mg": nutrient_quantity("TOCPHA"),
            "raw_response": data,
        }
    except requests.exceptions.RequestException:
        raise APIException(
            "Edamam could not complete the nutrition request", status_code=502)
    except (KeyError, TypeError, ValueError) as e:
        raise APIException(
            f"Invalid response from Edamam: {str(e)}", status_code=502)
