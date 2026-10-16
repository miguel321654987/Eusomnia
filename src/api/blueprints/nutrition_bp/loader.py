"""Loader para los parámetros de nutrición y sueño.

Este módulo se encarga de leer el archivo JSON de configuración
`nutrition_sleep_parameters.json`, cachearlo en memoria y exponer una
función sencilla `load_sleep_params()` que devuelve el diccionario con
todos los parámetros. La carga se realiza una sola vez por proceso y se
reutiliza en sucesivas llamadas, garantizando eficiencia y consistencia.
"""

import json
import os
from typing import Dict, Any

# Ruta absoluta al archivo JSON dentro del proyecto.
# Calculamos la ruta absoluta al archivo JSON. Partimos de la ubicación del
# módulo (`loader.py`) y subimos tres niveles para llegar al directorio `src`
# del proyecto, donde se encuentra la carpeta `config`.
_CONFIG_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..", "..", "..",  # subir desde nutrition_bp -> blueprints -> api -> src
        "config",
        "nutrition_sleep_parameters.json",
    )
)

# Cache en módulo para evitar lecturas repetidas.
_CACHED_PARAMS: Dict[str, Any] | None = None


def _load_file() -> Dict[str, Any]:
    """Lee el archivo JSON y devuelve su contenido.

    Lanza `FileNotFoundError` si el archivo no existe y `json.JSONDecodeError`
    si el contenido no es un JSON válido.
    """
    with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_sleep_params() -> Dict[str, Any]:
    """Devuelve los parámetros de nutrición/sueño.

    La primera llamada carga el archivo desde disco y lo almacena en la
    variable de módulo `_CACHED_PARAMS`. Las siguientes llamadas retornan el
    diccionario cacheado, evitando I/O adicional.
    """
    global _CACHED_PARAMS
    if _CACHED_PARAMS is None:
        _CACHED_PARAMS = _load_file()
    return _CACHED_PARAMS
