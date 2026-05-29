from flask import request, jsonify
from src.dao.ClasificacionesDAO import ClasificacionesDAO
from src.config.database import SessionLocal
from app import app



# -----------------------------
# Obtener DAO y sesión
# -----------------------------
def get_dao():
    session = SessionLocal()
    return ClasificacionesDAO(session), session


# -----------------------------
# Convertir objeto a JSON
# -----------------------------
def clasificacion_to_dict(clasificacion):
    return {
        "tipo": clasificacion.tipo,
        "descripcion": clasificacion.descripcion
    }


# -----------------------------
# CREATE
# -----------------------------
@app.route("/Clasificacion", methods=["POST"])
def create_clasificacion():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    for campo in ["tipo", "descripcion"]:
        if campo not in data:
            return jsonify({"error": f"Falta el campo {campo}"}), 400

    dao, session = get_dao()

    try:
        clasificacion = dao.crearClasificacion(
            data["tipo"],
            data["descripcion"]
        )

        return jsonify(clasificacion_to_dict(clasificacion)), 201

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# -----------------------------
# READ ALL
# -----------------------------
@app.route("/Clasificacion", methods=["GET"])
def obtener_clasificaciones():

    dao, session = get_dao()

    try:
        clasificaciones = dao.obtenerClasificaciones()

        return jsonify([
            clasificacion_to_dict(c)
            for c in clasificaciones
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# -----------------------------
# READ BY ID
# -----------------------------
@app.route("/Clasificacion/<tipo>", methods=["GET"])
def obtener_clasificacion(tipo):

    dao, session = get_dao()

    try:
        clasificacion = dao.obtenerClasificacionPorId(tipo)

        if clasificacion:
            return jsonify(
                clasificacion_to_dict(clasificacion)
            ), 200

        return jsonify({
            "error": "Clasificación no encontrada"
        }), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# -----------------------------
# UPDATE
# -----------------------------
@app.route("/Clasificacion/<tipo>", methods=["PUT"])
def actualizar_clasificacion(tipo):

    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    if "descripcion" not in data:
        return jsonify({
            "error": "Falta el campo descripcion"
        }), 400

    dao, session = get_dao()

    try:
        clasificacion = dao.actualizarClasificacion(
            tipo,
            data["descripcion"]
        )

        if clasificacion:
            return jsonify(
                clasificacion_to_dict(clasificacion)
            ), 200

        return jsonify({
            "error": "Clasificación no encontrada"
        }), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# -----------------------------
# DELETE
# -----------------------------
@app.route("/Clasificacion/<tipo>", methods=["DELETE"])
def eliminar_clasificacion(tipo):

    dao, session = get_dao()

    try:
        clasificacion = dao.obtenerClasificacionPorId(tipo)

        if not clasificacion:
            return jsonify({
                "error": "Clasificación no encontrada"
            }), 404

        dao.eliminarClasificacion(tipo)

        return jsonify({
            "mensaje": "Clasificación eliminada correctamente"
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()

