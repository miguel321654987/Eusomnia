"""Typed definitions shared across the nutrition blueprint.

These shapes describe the normalized data exchanged between the Edamam
service layer, the persistence layer and the evaluation endpoint.
"""

from typing import Literal, TypedDict


class NormalizedNutrition(TypedDict):
    """Flat nutrition payload aggregated from an Edamam response."""

    calories: float
    protein_g: float
    carbohydrates_g: float
    sugars_g: float
    fat_g: float
    sodium_mg: float
    caffeine_mg: float
    alcohol_g: float
    omega3_mg: float
    vitamin_e_mg: float
    vitamin_b12_ug: float
    total_weight_g: float
    meal_type: str | None
    other_excitants_present: bool
    raw_response: str


class NutrientStatus(TypedDict):
    """Evaluation of a single nutrient against its reference range."""

    nutrient: str
    unit: str | None
    value: float | None
    min_ref: float | None
    max_ref: float | None
    status: Literal["below", "within", "above", "no_reference"]


class MealDistribution(TypedDict):
    """Meal share of the daily nutrient totals (weight-factor rule)."""

    meal_type: str
    weight_factor: float
    share: float
    values: dict[str, float]


class ExcitantsReport(TypedDict):
    """Presence/absence report of sleep-disrupting excitants."""

    present: bool
    effect: Literal["negative", "neutral"]
