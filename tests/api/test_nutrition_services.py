import os
import sys

# Ensure the project src package is importable from the tests folder.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SRC_ROOT = os.path.join(PROJECT_ROOT, "src")
for _path in (SRC_ROOT, PROJECT_ROOT):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from api.blueprints.nutrition_bp import services  # noqa: E402


def _make_raw_response():
    """Minimal Edamam-like response with two parsed ingredients."""
    return {
        "uri": "http://www.edamam.com/ontologies/edamam.owl#recipe_test",
        "ingredients": [
            {
                "text": "1 small bread",
                "parsed": [{
                    "quantity": 1.0,
                    "measure": "roll",
                    "weight": 224.0,
                    "status": "OK",
                    "nutrients": {
                        "ENERC_KCAL": {"label": "Energy", "quantity": 560.0,
                                       "unit": "kcal"},
                        "PROCNT": {"label": "Protein", "quantity": 18.0,
                                   "unit": "g"},
                        "CHOCDF": {"label": "Carbs", "quantity": 100.0,
                                   "unit": "g"},
                        "SUGAR": {"label": "Sugars", "quantity": 10.0,
                                  "unit": "g"},
                    },
                }],
            },
            {
                "text": "50 g ham",
                "parsed": [{
                    "quantity": 50.0,
                    "measure": "gram",
                    "weight": 50.0,
                    "status": "OK",
                    "nutrients": {
                        "ENERC_KCAL": {"label": "Energy", "quantity": 150.0,
                                       "unit": "kcal"},
                        "PROCNT": {"label": "Protein", "quantity": 15.0,
                                   "unit": "g"},
                        "CHOCDF": {"label": "Carbs", "quantity": 1.0,
                                   "unit": "g"},
                        "SUGAR": {"label": "Sugars", "quantity": 0.5,
                                  "unit": "g"},
                    },
                }],
            },
        ],
    }


def test_aggregate_nutrients_sums_every_parsed_ingredient():
    totals = services.aggregate_nutrients(_make_raw_response())

    assert totals["calories"] == 710.0
    assert totals["protein_g"] == 33.0
    assert totals["carbohydrates_g"] == 101.0
    assert totals["sugars_g"] == 10.5
    assert totals["total_weight_g"] == 274.0
    # Codes absent from the response default to 0.0
    assert totals["vitamin_e_mg"] == 0.0
    assert totals["vitamin_b12_ug"] == 0.0


def test_manual_value_writes_off_fallback():
    pairs = [("2 cafés con leche", "2 coffees with milk")]
    supplements = services.resolve_supplement_values(
        pairs, {"caffeine_mg": 60.0, "alcohol_g": None, "omega3_mg": None})

    # Manual caffeine (60) wins over the dictionary estimate (190).
    assert supplements["caffeine_mg"] == 60.0
    assert supplements["alcohol_g"] == 0.0
    assert supplements["omega3_mg"] == 0.0


def test_fallback_estimates_caffeine_alcohol_and_omega3():
    caffeine = services.resolve_supplement_values(
        [("2 cafés", "2 coffees")], {"caffeine_mg": None})
    alcohol = services.resolve_supplement_values(
        [("1 vino tinto", "1 red wine")], {"alcohol_g": None})
    omega3 = services.resolve_supplement_values(
        [("100 g de salmón", "100 g salmon")], {"omega3_mg": None})

    assert caffeine["caffeine_mg"] == 190.0
    assert alcohol["alcohol_g"] == 14.0
    assert omega3["omega3_mg"] == 1800.0


def test_detect_excitants_present_and_absent():
    assert services.detect_excitants([("un té verde", "a green tea")]) is True
    assert services.detect_excitants([("1 espresso", "1 espresso")]) is True
    assert services.detect_excitants([("1 manzana", "1 apple")]) is False
    # Word boundaries must not flag "mate" inside "tomate".
    assert services.detect_excitants(
        [("1 tomate pequeño", "1 small tomato")]) is False


def test_analyze_foods_falls_back_to_get_on_low_quality(monkeypatch):
    """A rejected recipe POST must retry each line through the GET parser."""
    from api.utils import APIException

    def _reject_recipe(title, lines):
        raise APIException("low_quality", status_code=422)

    def _parse_single(query):
        return {
            "ingredients": [{
                "text": query,
                "parsed": [{
                    "quantity": 1.0,
                    "measure": "serving",
                    "weight": 100.0,
                    "status": "OK",
                    "nutrients": {
                        "ENERC_KCAL": {"label": "Energy", "quantity": 100.0,
                                       "unit": "kcal"},
                    },
                }],
            }],
        }

    monkeypatch.setattr(services, "translate_text", lambda text: text)
    monkeypatch.setattr(services, "fetch_edamam_recipe", _reject_recipe)
    monkeypatch.setattr(services, "fetch_edamam_ingredient", _parse_single)

    result = services.analyze_foods(
        "Meal", ["ham sandwich", "apple"], "lunch", {})

    assert result["calories"] == 200.0
    assert result["total_weight_g"] == 200.0


def _sample_values(**overrides):
    values = {
        "vitamin_e_mg": 5.0,
        "vitamin_b12_µg": 3.0,
        "protein_g": 50.0,
        "carbohydrates_percent": 50.0,
        "sugars_percent": 15.0,
        "alcohol_g": 7.0,
        "caffeine_mg": 250.0,
        "omega3_mg": 100.0,
        "carbohydrates_g": 175.0,
        "sugars_g": 26.0,
        "other_excitants_present": True,
    }
    values.update(overrides)
    return values


def test_evaluate_nutrition_classifies_ranges_from_json():
    result = services.evaluate_nutrition(_sample_values(), 70.0)
    statuses = {item["nutrient"]: item for item in result["nutrient_statuses"]}

    assert statuses["caffeine_mg"]["status"] == "above"  # 250 > 200 mg
    assert statuses["alcohol_g"]["status"] == "within"   # 7 <= 14 g
    assert statuses["omega3_mg"]["status"] == "below"    # 100 < 250 mg
    assert statuses["vitamin_e_mg"]["status"] == "below"  # 5 < 15 mg
    assert statuses["vitamin_b12_µg"]["status"] == "within"  # 3 >= 2.4
    assert statuses["carbohydrates_percent"]["status"] == "within"
    assert statuses["sugars_percent"]["status"] == "above"  # 15 > 10 %

    protein = statuses["protein_g"]
    assert protein["min_ref"] == 56.0 and protein["max_ref"] == 84.0
    assert protein["status"] == "below"  # 50 < 70 * 0.8

    excitants = result["excitants"]
    assert excitants == {"present": True, "effect": "negative"}


def test_evaluate_without_weight_has_no_protein_reference():
    result = services.evaluate_nutrition(_sample_values(), None)
    protein = next(
        item for item in result["nutrient_statuses"]
        if item["nutrient"] == "protein_g")

    assert protein["min_ref"] is None and protein["max_ref"] is None
    assert protein["status"] == "no_reference"


def test_evaluate_distributes_meals_by_weight_factor():
    result = services.evaluate_nutrition(_sample_values(), 70.0)
    distribution = result["meal_distribution"]

    assert [item["meal_type"] for item in distribution] == [
        "breakfast", "lunch", "snack", "dinner"]
    assert abs(sum(item["share"] for item in distribution) - 1.0) < 0.001

    dinner = distribution[-1]
    assert dinner["weight_factor"] == 1.5
    assert dinner["share"] == 0.3333
    # Caffeine for dinner: 250 * (1.5 / 4.5)
    assert abs(dinner["values"]["caffeine_mg"] - 83.33) < 0.02

