import importlib
import os
import sys
import pytest

# Ensure the project src package is on sys.path for imports.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SRC_ROOT = os.path.join(PROJECT_ROOT, "src")
for _path in (SRC_ROOT, PROJECT_ROOT):
    if _path not in sys.path:
        sys.path.insert(0, _path)


def test_jwt_secret_is_taken_from_env(monkeypatch):
    """Verifica que la aplicación Flask tome la clave JWT del entorno.

    Se establece una variable de entorno ``JWT_SECRET_KEY`` con una cadena
    de 32 caracteres (requisito recomendado) antes de recargar el módulo
    ``src.app``. Después de la recarga, el valor configurado en ``app.config``
    debe coincidir exactamente con la variable de entorno.
    """

    secure_key = "A" * 32  # 32‑byte string satisface la restricción de pyjwt
    monkeypatch.setenv("JWT_SECRET_KEY", secure_key)

    import src.app as app_module
    importlib.reload(app_module)

    assert app_module.app.config["JWT_SECRET_KEY"] == secure_key
