import os
import sys

# Aseguramos que el directorio raíz del proyecto está en sys.path para poder
# importar módulos usando rutas relativas al paquete.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import importlib.util

# Cargamos el módulo loader sin ejecutar el __init__ del paquete que
# depende de Flask (no disponible en el entorno de pruebas).
loader_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..", "..", "src", "api", "blueprints", "nutrition_bp", "loader.py",
    )
)
# Obtener la especificación del módulo y asegurarnos de que no sea None antes de usarla.
spec = importlib.util.spec_from_file_location("nutrition_loader", loader_path)
assert spec is not None and spec.loader is not None, "No se pudo cargar la especificación del módulo"
loader_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loader_module)
load_sleep_params = loader_module.load_sleep_params


def test_load_sleep_params_structure():
    """Verifica que la carga del JSON devuelva la estructura esperada."""
    params = load_sleep_params()
    assert isinstance(params, dict)
    # Claves principales obligatorias
    for key in ("metadata", "user_profile", "nutrients", "meals", "calculation_rules"):
        assert key in params

    # Verificamos que el cálculo de proteína por peso exista y se pueda evaluar
    protein = params["nutrients"]["protein_g"]
    assert "calc_min" in protein and "calc_max" in protein
    # Simulamos cálculo para un peso de 70 kg
    weight = 70
    min_val = eval(protein["calc_min"], {"weight_kg": weight})
    max_val = eval(protein["calc_max"], {"weight_kg": weight})
    assert min_val == weight * 0.8
    assert max_val == weight * 1.2

    # Verificamos factores de comida
    meals = params["meals"]
    expected_factors = {"breakfast": 0.8, "lunch": 1.0, "snack": 1.2, "dinner": 1.5}
    for meal, factor in expected_factors.items():
        assert meal in meals
        assert meals[meal]["weight_factor"] == factor
