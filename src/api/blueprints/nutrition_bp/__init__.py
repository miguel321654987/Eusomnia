from flask import Blueprint

nutrition_bp = Blueprint("nutrition_bp", __name__)

from . import routes

