from flask import Blueprint

analysis_bp = Blueprint("analysis_bp", __name__)

from . import routes

