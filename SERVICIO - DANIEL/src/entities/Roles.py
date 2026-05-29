from flask import request, jsonify
from src.dao.RolesDAO import RolesDAO
from src.config.database import SessionLocal
from app import app


def get_dao():
    session = SessionLocal()
    return RolesDAO(session), session


def rol_to_dict(rol):
    return {
        "id_rol": rol.id_rol,
        "nombre": rol.nombre
    }


# ================= CREATE =================
@app.route("/Rol", methods=["POST"])
def crear_rol():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    for campo in ["id_rol", "nombre"]:
        if campo not in data:
            return jsonify({"error": f"Falta el campo {campo}"}), 400

    dao, session = get_dao()

    try:
        rol = dao.crearRol(
            data["id_rol"],
            data["nombre"]
        )

        return jsonify(rol_to_dict(rol)), 201

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= READ ALL =================
@app.route("/Rol", methods=["GET"])
def obtener_roles():
    dao, session = get_dao()

    try:
        roles = dao.obtenerRoles()

        return jsonify([
            rol_to_dict(r)
            for r in roles
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= READ POR ID =================
@app.route("/Rol/<id_rol>", methods=["GET"])
def obtener_rol_por_id(id_rol):
    dao, session = get_dao()

    try:
        rol = dao.obtenerRolPorId(id_rol)

        if rol:
            return jsonify(rol_to_dict(rol)), 200
        else:
            return jsonify({"error": "Rol no encontrado"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= UPDATE =================
@app.route("/Rol/<id_rol>", methods=["PUT"])
def actualizar_rol(id_rol):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    dao, session = get_dao()

    try:
        rol = dao.actualizarRol(
            id_rol,
            data.get("nombre")
        )

        if rol:
            return jsonify(rol_to_dict(rol)), 200
        else:
            return jsonify({"error": "Rol no encontrado"}), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= DELETE =================
@app.route("/Rol/<id_rol>", methods=["DELETE"])
def eliminar_rol(id_rol):
    dao, session = get_dao()

    try:
        eliminado = dao.eliminarRol(id_rol)

        if eliminado:
            return jsonify({"message": "Rol eliminado exitosamente"}), 200
        else:
            return jsonify({"error": "Rol no encontrado"}), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()