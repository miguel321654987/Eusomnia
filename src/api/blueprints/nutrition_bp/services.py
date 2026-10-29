import os
import requests
from api.utils import APIException
from api.services.translation_service import (
    translate_edamam_response,
    translate_texts,
)
# Load environment variables when this module is imported (important for unit tests)
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


def fetch_nutrition_data(query: str, custom_key: Optional[str] = None) -> dict:
    """Fetch nutrition details from the Edamam Nutrition Analysis API."""
    app_id = os.getenv("EDAMAM_APP_ID")
    app_key = os.getenv("EDAMAM_APP_KEY")
    if not app_id or not app_key:
        raise APIException(
            "Edamam credentials are not configured on server", status_code=500)

    translated_query = translate_texts(
        [query],
        target_language="English",
        custom_key=custom_key,
    )[0]
    base_url = os.getenv("EDAMAM_BASE_URL", "https://api.edamam.com").rstrip("/")
    url = f"{base_url}/api/nutrition-data"
    response = None
    try:
        response = requests.get(
            url,
            params={
                "app_id": app_id,
                "app_key": app_key,
                "nutrition-type": "logging",
                "ingr": translated_query,
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict):
            raise APIException(
                "Edamam devolvió una respuesta nutricional inválida.",
                status_code=502,
            )
        data = translate_edamam_response(data, custom_key=custom_key)

        nutrients = data.get("totalNutrients", {})
        relevant_nutrients = ("FAT", "PROCNT", "CHOCDF")
        has_nutrition_values = any(
            (nutrients.get(nutrient_id) or {}).get("quantity", 0) > 0
            for nutrient_id in relevant_nutrients
        )
        if data.get("calories", 0) <= 0 and not has_nutrition_values:
            raise APIException(
                "Edamam no pudo identificar el alimento. Escribe el nombre "
                "en español y añade una cantidad o porción.",
                status_code=422,
            )

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
    except APIException:
        raise
    except requests.exceptions.HTTPError:
        status_code = response.status_code if response is not None else "unknown"
        raise APIException(
            f"Edamam rechazó la solicitud nutricional (HTTP {status_code}). "
            "Revisa las credenciales, los límites del plan y el alimento indicado.",
            status_code=502,
        ) from None
    except requests.exceptions.RequestException as error:
        raise APIException(
            f"No se pudo conectar con Edamam ({type(error).__name__}).",
            status_code=502,
        ) from None
    except (KeyError, TypeError, ValueError) as e:
        raise APIException(
            f"Edamam devolvió una respuesta inválida: {type(e).__name__}.",
            status_code=502,
        )
