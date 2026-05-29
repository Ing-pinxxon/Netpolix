from flask import request, jsonify
from src.dao.ClientesDAO import ClientesDAO
from src.config.database import SessionLocal
from app import app


def get_dao():
    session = SessionLocal()
    return ClientesDAO(session), session


def cliente_to_dict(cliente):
    return {
        "id_cliente": cliente.id_cliente,
        "nombre": cliente.nombre,
        "apellido": cliente.apellido,
        "email": cliente.email,
        "password": cliente.password
    }


# ================= CREATE =================
@app.route("/Cliente", methods=["POST"])
def crear_cliente():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    for campo in ["id_cliente", "nombre", "apellido", "email", "password"]:
        if campo not in data:
            return jsonify({"error": f"Falta el campo {campo}"}), 400

    dao, session = get_dao()

    try:
        cliente = dao.crearCliente(
            data["id_cliente"],
            data["nombre"],
            data["apellido"],
            data["email"],
            data["password"]
        )

        return jsonify(cliente_to_dict(cliente)), 201

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= READ ALL =================
@app.route("/Cliente", methods=["GET"])
def obtener_clientes():
    dao, session = get_dao()

    try:
        clientes = dao.obtenerClientes()

        return jsonify([
            cliente_to_dict(c)
            for c in clientes
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= READ POR ID =================
@app.route("/Cliente/<id_cliente>", methods=["GET"])
def obtener_cliente_por_id(id_cliente):
    dao, session = get_dao()

    try:
        cliente = dao.obtenerClientePorId(id_cliente)

        if cliente:
            return jsonify(cliente_to_dict(cliente)), 200
        else:
            return jsonify({"error": "Cliente no encontrado"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= UPDATE =================
@app.route("/Cliente/<id_cliente>", methods=["PUT"])
def actualizar_cliente(id_cliente):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    dao, session = get_dao()

    try:
        cliente = dao.actualizarCliente(
            id_cliente,
            data.get("nombre"),
            data.get("apellido"),
            data.get("email"),
            data.get("password")
        )

        if cliente:
            return jsonify(cliente_to_dict(cliente)), 200
        else:
            return jsonify({"error": "Cliente no encontrado"}), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= DELETE =================
@app.route("/Cliente/<id_cliente>", methods=["DELETE"])
def eliminar_cliente(id_cliente):
    dao, session = get_dao()

    try:
        eliminado = dao.eliminarCliente(id_cliente)

        if eliminado:
            return jsonify({"message": "Cliente eliminado exitosamente"}), 200
        else:
            return jsonify({"error": "Cliente no encontrado"}), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()