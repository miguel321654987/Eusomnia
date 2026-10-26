"""
This module takes care of starting the API Server, loading the DB and adding the endpoints.
"""

import os
from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv

from api.utils import APIException, generate_sitemap
from api.admin import setup_admin
from api.models import db
from flask_jwt_extended import JWTManager
from api.routes import api
from api.extensions import bcrypt
from sqlalchemy import select

load_dotenv()

# Create Flask application
# Añadimos una anotación de tipo para mejorar la detección estática y evitar errores de Pylance
app: Flask = Flask(__name__)

# Configuración de CORS para permitir solicitudes del frontend en desarrollo
# Se especifica el origen del frontend y se habilita el soporte de credenciales
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
            ]
        }
    },
    supports_credentials=True,
)

# Nota: este fallback es para trabajar en modo local desde VS Code/localhost.
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "local-dev-secret-key")

jwt = JWTManager(app)

# UNIÓN OFICIAL: Aquí le inyectamos el motor Flask a Bcrypt
bcrypt.init_app(app)

# Application-level configuration inherited from environment variables (.env).
app.config["QDRANT_URL"] = os.getenv("QDRANT_URL", "http://localhost:6333")
app.config["QDRANT_API_KEY"] = os.getenv("QDRANT_API_KEY")
app.config["QDRANT_COLLECTION"] = os.getenv(
    "QDRANT_COLLECTION", "dream_dictionary")
app.config["OPENROUTER_BASE_URL"] = os.getenv(
    "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
)
app.config["EMBEDDING_MODEL"] = os.getenv(
    "EMBEDDING_MODEL", "openai/text-embedding-3-small"
)
# Modelo por defecto para OpenRouter. Se utiliza el router gratuito que delega al modelo libre disponible.
# Puede sobrescribirse mediante la variable de entorno OPENROUTER_MODEL.
app.config["OPENROUTER_MODEL"] = os.getenv(
    "OPENROUTER_MODEL", "openrouter/free"
)

app.url_map.strict_slashes = False

db_url = os.getenv("DATABASE_URL")
if db_url is not None and not db_url.startswith("sqlite:///"):
    # Convert possible postgres:// scheme to sqlalchemy compatible form
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.replace(
        "postgres://", "postgresql://")
else:
    # Bloque especial para Windows Local
    base_dir = os.path.abspath(os.path.dirname(__file__))
    instance_dir = os.path.join(base_dir, "instance")

    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)

    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(instance_dir, 'example.db')}"

MIGRATE = Migrate(app, db)
db.init_app(app)

setup_admin(app)

# REGISTRO DE BLUEPRINTS
app.register_blueprint(api, url_prefix="/api")


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints


@app.route("/")
def sitemap():
    return generate_sitemap(app)


if __name__ == "__main__":
    # LANZAMIENTO DEL SERVIDOR WEB FLASK
    # Leemos el puerto asignado en las variables de entorno (por defecto el 3000)
    PORT = int(os.environ.get("PORT", 3000))

    print(f"🚀 Servidor Flask listo y escuchando en el puerto {PORT}...")

    # Encendemos los sockets de Flask para empezar a recibir peticiones de usuarios o frontend
    app.run(host="0.0.0.0", port=PORT, debug=False)
