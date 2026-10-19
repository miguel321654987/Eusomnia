from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from api.extensions import db, bcrypt
from api.utils import APIException
from api.blueprints.user_bp import user_bp
from api.blueprints.user_bp.models import User, UserPreferences


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
def update_preferences():
    """Actualizar las preferencias del usuario autenticado.

    Se aceptan los campos ``ai_provider``, ``custom_api_key``, ``selected_model``
    y ``timezone``. Sólo los provistos en el JSON son actualizados.
    """
    user_id = int(get_jwt_identity())
    pref = db.session.query(UserPreferences).filter_by(user_id=user_id).first()
    if not pref:
        # Si no existen, crear una con valores por defecto
        pref = UserPreferences(user_id=user_id)
        db.session.add(pref)

    data = request.get_json() or {}
    # Campos opcionales a actualizar
    for field in ["ai_provider", "custom_api_key", "selected_model", "timezone"]:
        if field in data:
            setattr(pref, field, data[field])

    db.session.commit()
    return jsonify({"message": "Preferences updated", "preferences": pref.serialize()}), 200


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

    data = request.get_json() or {}
    current_password = data.get("current_password")
    if not current_password:
        raise APIException("'current_password' is required", status_code=400)

    user = db.session.get(User, user_id)
    if not user:
        raise APIException("User not found", status_code=404)

    if not bcrypt.check_password_hash(user.password, current_password):
        raise APIException("Invalid password", status_code=401)

    # Eliminar usuario (y cascada a preferencias si está configurado en el modelo)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200
