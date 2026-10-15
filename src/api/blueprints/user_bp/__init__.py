# Definir el Blueprint antes de cargar las rutas para romper el ciclo de importación
from flask import Blueprint

user_bp = Blueprint("user_bp", __name__)

# Importar rutas después de crear el Blueprint
from . import routes
