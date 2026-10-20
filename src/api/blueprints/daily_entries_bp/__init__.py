# Definir el Blueprint antes de importar las rutas para evitar ciclos de importación
from flask import Blueprint

daily_entries_bp = Blueprint("daily_entries_bp", __name__)

# Importar las rutas después de que el Blueprint esté disponible
from . import routes
