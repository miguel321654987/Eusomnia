from flask import Blueprint
from api.blueprints.user_bp import user_bp
from api.blueprints.daily_entries_bp import daily_entries_bp
from api.blueprints.nutrition_bp import nutrition_bp
from api.blueprints.analysis_bp import analysis_bp

api = Blueprint('api', __name__)

# Registro modular con sus prefijos de URL correspondientes:
api.register_blueprint(user_bp, url_prefix='/users')           # /api/users/...
# /api/entries/...
api.register_blueprint(daily_entries_bp, url_prefix='/entries')
# /api/nutrition/...
api.register_blueprint(nutrition_bp, url_prefix='/nutrition')
# /api/analysis/...
api.register_blueprint(analysis_bp, url_prefix='/analysis')
