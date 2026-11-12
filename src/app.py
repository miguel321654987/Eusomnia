"""
This module takes care of starting the API Server, loading the DB and adding the endpoints.
"""

import os
from datetime import timedelta
from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
import click
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
app: Flask = Flask(__name__)

# Universal CORS configuration for development and production
CORS(app)

# Fallback for local development
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "local-dev-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

jwt = JWTManager(app)

# Inject Flask into Bcrypt
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
# Default model for OpenRouter
app.config["OPENROUTER_MODEL"] = os.getenv(
    "OPENROUTER_MODEL", "openai/gpt-4o-mini"
)

app.url_map.strict_slashes = False

db_url = os.getenv("DATABASE_URL")
if db_url is not None and not db_url.startswith("sqlite:///"):
    # Convert possible postgres:// scheme to sqlalchemy compatible form
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.replace(
        "postgres://", "postgresql://")
else:
    # Local fallback for SQLite
    base_dir = os.path.abspath(os.path.dirname(__file__))
    instance_dir = os.path.join(base_dir, "instance")

    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)

    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(instance_dir, 'example.db')}"

MIGRATE = Migrate(app, db)
db.init_app(app)

with app.app_context():
    try:
        db.create_all()
        print("✅ Database initialized and tables verified/created.")
    except Exception as e:
        print(f"⚠️ Error initializing database automatically: {e}")

setup_admin(app)


@app.cli.command("rebuild-dream-collection")
def rebuild_dream_collection_command():
    """Rebuild the Qdrant dream dictionary collection."""
    from api.services.qdrant_service import DreamRetrievalService

    service = DreamRetrievalService()
    count = service.rebuild_collection_from_csv()
    click.echo(
        f"Indexed {count} dream dictionary points with the current embeddings.")


# Blueprint registration
app.register_blueprint(api, url_prefix="/api")


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


@app.route("/")
def health_check():
    return jsonify({
        "status": "online",
        "service": "Eusomnia Backend API"
    }), 200


@app.route("/sitemap")
def sitemap():
    return generate_sitemap(app)


if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 3000))

    print(f"🚀 Servidor Flask listo y escuchando en el puerto {PORT}...")

    app.run(host="0.0.0.0", port=PORT, debug=False)
