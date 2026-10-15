from flask import request, jsonify
from sqlalchemy import select
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from api.extensions import db, bcrypt
from api.utils import APIException
# Importación relativa al blueprint para evitar ciclo de importación
from . import user_bp
from api.blueprints.user_bp.models import User, UserPreferences


@user_bp.route("/signup", methods=["POST"])
def handle_signup():
    body = request.get_json()
    if body is None:
        raise APIException("JSON body is required", status_code=400)

    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    last_name = body.get("last_name")

    if not email or not isinstance(email, str) or email.strip() == "":
        raise APIException("Field 'email' is required", status_code=400)
    if not password or not isinstance(password, str) or password.strip() == "":
        raise APIException("Field 'password' is required", status_code=400)
    if not name or not isinstance(name, str) or name.strip() == "":
        raise APIException("Field 'name' is required", status_code=400)
    if not last_name or not isinstance(last_name, str) or last_name.strip() == "":
        raise APIException("Field 'last_name' is required", status_code=400)

    stmt = select(User).where(User.email == email.strip())
    user_exists = db.session.execute(stmt).scalar_one_or_none()

    if user_exists is not None:
        raise APIException("Email is already registered", status_code=409)

    try:
        hashed_password = bcrypt.generate_password_hash(password.strip()).decode("utf-8")

        new_user = User(
            email=email.strip(),
            password=hashed_password,
            name=name.strip(),
            last_name=last_name.strip(),
            is_active=True
        )

        db.session.add(new_user)
        db.session.flush()

        default_preferences = UserPreferences(user_id=new_user.id)
        db.session.add(default_preferences)
        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "results": new_user.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        raise APIException(f"Internal server error creating user: {str(e)}", status_code=500)


@user_bp.route("/login", methods=["POST"])
def create_token():
    body = request.get_json()
    if body is None:
        raise APIException("JSON body is required", status_code=400)

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        raise APIException("Fields 'email' and 'password' are required", status_code=400)

    stmt = select(User).where(User.email == email.strip())
    user = db.session.execute(stmt).scalar_one_or_none()

    if user is None or not bcrypt.check_password_hash(user.password, password.strip()):
        raise APIException("Invalid credentials. Email or password incorrect", status_code=401)

    if not user.is_active:
        raise APIException("Access denied: Your account is deactivated", status_code=403)

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Authentication successful",
        "token": access_token,
        "user_id": user.id
    }), 200


@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))

    if user is None:
        raise APIException("User not found", status_code=404)

    if not user.is_active:
        raise APIException("Access denied: Your account is deactivated", status_code=403)

    return jsonify({
        "message": "Access granted to profile",
        "results": user.serialize()
    }), 200


@user_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    current_user_id = int(get_jwt_identity())
    stmt = select(UserPreferences).where(UserPreferences.user_id == current_user_id)
    prefs = db.session.execute(stmt).scalar_one_or_none()

    if prefs is None:
        prefs = UserPreferences(user_id=current_user_id)
        db.session.add(prefs)
        db.session.commit()

    return jsonify({
        "message": "User preferences retrieved successfully",
        "results": prefs.serialize()
    }), 200


@user_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_user_preferences():
    current_user_id = int(get_jwt_identity())
    body = request.get_json()
    if body is None:
        raise APIException("JSON body is required", status_code=400)

    stmt = select(UserPreferences).where(UserPreferences.user_id == current_user_id)
    prefs = db.session.execute(stmt).scalar_one_or_none()

    if prefs is None:
        prefs = UserPreferences(user_id=current_user_id)
        db.session.add(prefs)

    if "ai_provider" in body:
        prefs.ai_provider = body["ai_provider"]
    if "custom_api_key" in body:
        prefs.custom_api_key = body["custom_api_key"]
    if "selected_model" in body:
        prefs.selected_model = body["selected_model"]
    if "timezone" in body:
        prefs.timezone = body["timezone"]

    try:
        db.session.commit()
        return jsonify({
            "message": "User preferences updated successfully",
            "results": prefs.serialize()
        }), 200
    except Exception as e:
        db.session.rollback()
        raise APIException(f"Error updating preferences: {str(e)}", status_code=500)


@user_bp.route('', methods=['GET'])
def get_all_users():
    stmt = select(User)
    users_query = db.session.scalars(stmt).all()

    if not users_query:
        return jsonify({
            "message": "No users found in database",
            "results": []
        }), 200

    all_users = [user.serialize() for user in users_query]

    return jsonify({
        "message": "Users retrieved successfully",
        "results": all_users,
        "total_users": len(all_users)
    }), 200


@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    user = db.session.get(User, user_id)

    if user is None:
        raise APIException(f"User with ID {user_id} was not found", status_code=404)

    return jsonify({
        "message": "User retrieved successfully",
        "results": user.serialize()
    }), 200


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if int(user_id) != int(current_user_id):
        raise APIException("You are not allowed to delete this account", status_code=403)

    body = request.get_json(silent=True)
    if body is None or 'current_password' not in body:
        raise APIException("Current password is required to delete account", status_code=400)

    current_password = body.get('current_password')
    if not isinstance(current_password, str) or current_password.strip() == "":
        raise APIException("Invalid password provided", status_code=400)

    user = db.session.get(User, user_id)
    if user is None:
        raise APIException(f"User with ID {user_id} does not exist", status_code=404)

    if not bcrypt.check_password_hash(user.password, current_password.strip()):
        raise APIException("Current password is incorrect", status_code=401)

    try:
        db.session.delete(user)
        db.session.commit()

        return jsonify({
            "message": f"Account with ID {user_id} has been permanently deleted",
            "id_deleted": user_id
        }), 200

    except Exception as e:
        db.session.rollback()
        raise APIException(f"Internal error deleting user: {str(e)}", status_code=500)

