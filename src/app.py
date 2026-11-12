"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
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
# Importamos la función pura de sincronización para el seeding automático al arrancar
from sqlalchemy import select

load_dotenv()

app = Flask(__name__)

CORS(app)

# Nota: este fallback es para trabajar en modo local desde VS Code/localhost.
app.config['JWT_SECRET_KEY'] = os.getenv(
    'JWT_SECRET_KEY', 'local-dev-secret-key')

jwt = JWTManager(app)

# UNIÓN OFICIAL: Aquí le inyectamos el motor Flask a Bcrypt
bcrypt.init_app(app)

app.url_map.strict_slashes = False

db_url = os.getenv("DATABASE_URL")
if db_url is not None and not db_url.startswith("sqlite:///"):
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    # Bloque especial para Windows Local
    base_dir = os.path.abspath(os.path.dirname(__file__))
    instance_dir = os.path.join(base_dir, 'instance')

    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)

    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(instance_dir, 'example.db')}"

MIGRATE = Migrate(app, db)
db.init_app(app)

with app.app_context():
    try:
        db.create_all()
        print("✅ Base de datos inicializada y tablas verificadas/creadas correctamente en PostgreSQL.")
    except Exception as e:
        print(f"⚠️ Error al inicializar la base de datos automáticamente: {e}")


CORS(app)
setup_admin(app)


# REGISTRO DE BLUEPRINTS
# Registramos el blueprint maestro 'api' que viene de routes.py
app.register_blueprint(api, url_prefix='/api')


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


# generate sitemap with all your endpoints
# Serve React frontend static files
import mimetypes
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../dist'))

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    else:
        if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
            return send_from_directory(DIST_DIR, 'index.html')
        else:
            return generate_sitemap(app)

from flask import send_from_directory


@app.route('/')
def sitemap():
    return generate_sitemap(app)


if __name__ == '__main__':

    # LANZAMIENTO DEL SERVIDOR WEB FLASK
    # Leemos el puerto asignado en las variables de entorno (por defecto el 3000)
    PORT = int(os.environ.get('PORT', 3000))

    print(f"🚀 Servidor Flask listo y escuchando en el puerto {PORT}...")

    # Encendemos los sockets de Flask para empezar a recibir peticiones de usuarios o frontend
    app.run(host='0.0.0.0', port=PORT, debug=False)
