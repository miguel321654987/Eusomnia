import re
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from api.extensions import db, bcrypt
from api.utils import APIException
from api.blueprints.user_bp import user_bp
from api.blueprints.user_bp.models import User, UserPreferences

CHRONOTYPES = {"wolf", "lion", "bear", "dolphin"}
INTERPRETATION_FRAMEWORKS = {"jungian", "neuroscientific", "holistic"}
REPORT_DEPTHS = {"concise", "standard", "clinical"}
PROFILE_FIELDS = {"name", "last_name", "email", "birth_year", "chronotype"}
PREFERENCE_FIELDS = {
    "ai_provider",
    "custom_api_key",
    "selected_model",
    "timezone",
    "interpretation_framework",
    "report_depth",
    "include_nutrition_in_analysis",
    "morning_reminder_enabled",
    "morning_reminder_time",
    "caffeine_reminder_enabled",
    "caffeine_reminder_time",
    "winddown_reminder_enabled",
    "winddown_reminder_time",
}


def _validated_time(value, field_name):
    if not isinstance(value, str) or not re.fullmatch(r"\d{2}:\d{2}", value):
        raise APIException(f"{field_name} must use HH:MM format", status_code=400)
    try:
        datetime.strptime(value, "%H:%M")
    except ValueError as exc:
        raise APIException(
            f"{field_name} must be a valid time", status_code=400
        ) from exc
    return value


def _validated_timezone(value):
    if not isinstance(value, str) or not value.strip():
        raise APIException("timezone is required", status_code=400)
    value = value.strip()
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise APIException("timezone must be a valid IANA timezone", status_code=400) from exc
    return value


@user_bp.errorhandler(APIException)
def handle_user_api_exception(error):
    db.session.rollback()
    return jsonify(error.to_dict()), error.status_code


@user_bp.route("/signup", methods=["POST"])
def register_user():
    """Crear una cuenta de usuario.

    Se espera un cuerpo JSON con los campos:
    ``email``, ``password``, ``name`` y ``last_name``.
    """
    data = request.get_json()
    if not data:
        raise APIException("JSON body is required", status_code=400)

    required = ["email", "password", "name", "last_name"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        raise APIException(
            f"Missing fields: {', '.join(missing)}", status_code=400)

    if db.session.query(User).filter_by(email=data["email"]).first():
        raise APIException(
            "User with this email already exists", status_code=409)

    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = User(
        email=data["email"],
        password=hashed_pw,
        name=data["name"],
        last_name=data["last_name"],
    )
    db.session.add(user)
    db.session.flush()  # Obtain user.id before commit

    # Crear preferencias por defecto para el nuevo usuario
    preferences = UserPreferences(user_id=user.id)
    db.session.add(preferences)
    db.session.commit()

    return jsonify({"message": "User registered successfully", "user": user.serialize()}), 201


@user_bp.route("/login", methods=["POST"])
def login_user():
    """Autenticar al usuario y devolver un token JWT.

    Se requiere ``email`` y ``password`` en el cuerpo JSON.
    """
    data = request.get_json()
    if not data:
        raise APIException("JSON body is required", status_code=400)

    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        raise APIException(
            "Both email and password are required", status_code=400)

    user = db.session.query(User).filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        raise APIException("Invalid credentials", status_code=401)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "user": user.serialize()}), 200


@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_current_user():
    """Devuelve la información del usuario autenticado y sus preferencias."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        raise APIException("User not found", status_code=404)

    preferences = (
        db.session.query(UserPreferences).filter_by(user_id=user_id).first()
    )
    return jsonify({
        "user": user.serialize(),
        "preferences": preferences.serialize() if preferences else None,
    }), 200


@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update personal information, AI settings, and reminder preferences."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        raise APIException("User not found", status_code=404)

    data = request.get_json()
    if not isinstance(data, dict):
        raise APIException("JSON object is required", status_code=400)

    unknown_fields = set(data) - PROFILE_FIELDS - PREFERENCE_FIELDS
    if unknown_fields:
        raise APIException(
            f"Unsupported profile fields: {', '.join(sorted(unknown_fields))}",
            status_code=400,
        )

    pref = db.session.scalar(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    if pref is None:
        pref = UserPreferences(user_id=user_id)
        db.session.add(pref)

    if "name" in data:
        value = data["name"].strip() if isinstance(data["name"], str) else ""
        if not value or len(value) > 80:
            raise APIException("name must contain 1 to 80 characters", status_code=400)
        user.name = value

    if "last_name" in data:
        value = (
            data["last_name"].strip()
            if isinstance(data["last_name"], str)
            else ""
        )
        if not value or len(value) > 80:
            raise APIException(
                "last_name must contain 1 to 80 characters", status_code=400
            )
        user.last_name = value

    if "email" in data:
        email = data["email"].strip().lower() if isinstance(data["email"], str) else ""
        if (
            len(email) > 120
            or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)
        ):
            raise APIException("email must be a valid email address", status_code=400)
        existing_user = db.session.scalar(
            select(User).where(User.email == email, User.id != user_id)
        )
        if existing_user:
            raise APIException("Email address is already in use", status_code=409)
        user.email = email

    if "birth_year" in data:
        value = data["birth_year"]
        if value in ("", None):
            user.birth_year = None
        else:
            if isinstance(value, bool) or not (
                isinstance(value, int)
                or isinstance(value, str)
                and re.fullmatch(r"\d{4}", value)
            ):
                raise APIException(
                    "birth_year must be a valid year", status_code=400
                )
            birth_year = int(value)
            if not 1900 <= birth_year <= datetime.now().year:
                raise APIException(
                    "birth_year is outside the supported range", status_code=400
                )
            user.birth_year = birth_year

    if "chronotype" in data:
        chronotype = data["chronotype"]
        if chronotype in ("", None):
            user.chronotype = None
        elif not isinstance(chronotype, str) or chronotype not in CHRONOTYPES:
            raise APIException("chronotype is not supported", status_code=400)
        else:
            user.chronotype = chronotype

    if "timezone" in data:
        pref.timezone = _validated_timezone(data["timezone"])

    if "ai_provider" in data:
        if data["ai_provider"] != "openrouter":
            raise APIException("ai_provider is not supported", status_code=400)
        pref.ai_provider = data["ai_provider"]

    if "custom_api_key" in data:
        value = data["custom_api_key"]
        if value is not None and (
            not isinstance(value, str) or len(value) > 255
        ):
            raise APIException("custom_api_key must be at most 255 characters", status_code=400)
        pref.custom_api_key = value.strip() if isinstance(value, str) else None

    if "selected_model" in data:
        value = data["selected_model"]
        if not isinstance(value, str) or not value.strip() or len(value) > 100:
            raise APIException("selected_model must contain 1 to 100 characters", status_code=400)
        pref.selected_model = value.strip()

    if "interpretation_framework" in data:
        value = data["interpretation_framework"]
        if (
            not isinstance(value, str)
            or value not in INTERPRETATION_FRAMEWORKS
        ):
            raise APIException(
                "interpretation_framework is not supported", status_code=400
            )
        pref.interpretation_framework = value

    if "report_depth" in data:
        value = data["report_depth"]
        if not isinstance(value, str) or value not in REPORT_DEPTHS:
            raise APIException("report_depth is not supported", status_code=400)
        pref.report_depth = value

    boolean_fields = (
        "include_nutrition_in_analysis",
        "morning_reminder_enabled",
        "caffeine_reminder_enabled",
        "winddown_reminder_enabled",
    )
    for field in boolean_fields:
        if field in data:
            if not isinstance(data[field], bool):
                raise APIException(f"{field} must be a boolean", status_code=400)
            setattr(pref, field, data[field])

    time_fields = (
        "morning_reminder_time",
        "caffeine_reminder_time",
        "winddown_reminder_time",
    )
    for field in time_fields:
        if field in data:
            setattr(pref, field, _validated_time(data[field], field))

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIException("Email address is already in use", status_code=409) from exc

    return jsonify({
        "message": "Profile updated successfully",
        "user": user.serialize(),
        "preferences": pref.serialize(),
    }), 200


@user_bp.route("/profile/password", methods=["POST"])
@jwt_required()
def change_password():
    """Change the authenticated user's password after verifying the current one."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        raise APIException("User not found", status_code=404)

    data = request.get_json()
    if not isinstance(data, dict):
        raise APIException("JSON object is required", status_code=400)

    current_password = data.get("current_password")
    new_password = data.get("new_password")
    if not isinstance(current_password, str) or not current_password:
        raise APIException("'current_password' is required", status_code=400)
    if not bcrypt.check_password_hash(user.password, current_password):
        raise APIException("Invalid current password", status_code=401)
    if not isinstance(new_password, str) or len(new_password) < 8:
        raise APIException(
            "new_password must contain at least 8 characters", status_code=400
        )
    if len(new_password) > 128:
        raise APIException(
            "new_password must contain at most 128 characters", status_code=400
        )

    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200


@user_bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    """Listar todos los usuarios (paginado).

    Sólo usuarios autenticados pueden acceder a este recurso; en entornos de
    producción se esperaría que sólo administradores lo usen, pero por ahora el
    control de roles no está modelado, así que cualquier usuario autenticado
    podrá obtener la lista.
    """
    # Parámetros de paginación simples
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 100))
    except ValueError:
        raise APIException("Invalid pagination parameters", status_code=400)

    if page < 1 or per_page < 1:
        raise APIException(
            "Pagination parameters must be positive", status_code=400)

    query = db.session.query(User).order_by(User.id)
    users = query.offset((page - 1) * per_page).limit(per_page).all()
    total = query.count()
    return (
        jsonify(
            {
                "users": [u.serialize() for u in users],
                "page": page,
                "per_page": per_page,
                "total": total,
            }
        ),
        200,
    )


@user_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id: int):
    """Obtener información de un usuario específico por ID."""
    user = db.session.get(User, user_id)
    if not user:
        raise APIException("User not found", status_code=404)
    return jsonify({"user": user.serialize()}), 200


@user_bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id: int):
    """Eliminar la cuenta del usuario autenticado.

    El cuerpo JSON debe contener ``current_password`` para confirmar la acción.
    Sólo el propio usuario (o un administrador en caso de existir) puede
    eliminarse.
    """
    jwt_user_id = int(get_jwt_identity())
    if jwt_user_id != user_id:
        # En ausencia de roles de administrador, denegamos la operación.
        raise APIException("Permission denied", status_code=403)

    data = request.get_json()
    if not isinstance(data, dict):
        raise APIException("JSON object is required", status_code=400)
    current_password = data.get("current_password")
    if not isinstance(current_password, str) or not current_password:
        raise APIException("'current_password' is required", status_code=400)

    user = db.session.get(User, user_id)
    if not user:
        raise APIException("User not found", status_code=404)

    if not bcrypt.check_password_hash(user.password, current_password):
        raise APIException("Invalid password", status_code=401)

    # ORM cascades delete the user's preferences and daily records with their details.
    db.session.delete(user)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise APIException(
            "Account data could not be deleted completely", status_code=409
        ) from exc
    return jsonify({"message": "User deleted successfully"}), 200
