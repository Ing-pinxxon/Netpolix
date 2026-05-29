from flask import request, jsonify
from src.dao.SeriesDAO import SeriesDAO
from src.config.database import SessionLocal
from app import app

def get_dao():
    session = SessionLocal()
    return SeriesDAO(session), session

def serie_to_dict(serie):
    return{
        "id_serie": serie.id_serie,
        "titulo": serie.titulo,
        "sinopsis":serie.sinopsis,
        "temporada":serie.temporada
    }

#CREATE
@app.route("/Serie", methods=["POST"])
def crear_serie():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400
    for campo in ["id_serie", "titulo", "sinopsis", "temporada"]:
        if campo not in data:
            return jsonify({"error": f"Falta el campo {campo}"}), 400
    
    dao, session = get_dao()

    try:
        serie = dao.crearSerie(
            data["id_serie"],
            data["titulo"],
            data["sinopsis"],
            data["temporada"]
        )
        return jsonify(serie_to_dict(serie)), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
#READ ALL
@app.route("/Serie", methods=["GET"])
def obtener_serie():
    dao, session = get_dao()
    try:
        series = dao.obtenerSeries()
        return jsonify([
            serie_to_dict(s)
            for s in series
        ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

#READ POR ID
@app.route("/Serie/<id_serie>", methods=["GET"])
def obtener_serie_por_Id(id_serie):
    dao, session = get_dao()
    
    try:
        serie = dao.obtenerSeriePorId(id_serie)
        if serie:
            return jsonify(serie_to_dict(serie)), 200
        else:
            return jsonify({"error": "Serie no encontrada"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}),500
    finally:
        session.close()

#UPDATE
@app.route("/Serie/<id_serie>", methods=["PUT"])

def actualizar_serie(id_serie):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron los datos"}), 400
    for campo in ["id_serie", "titulo", "sinopsis", "temporada"]:
        if campo not in data:
            return jsonify({"error": f"Falta el campo {campo}"}), 400
    dao, session = get_dao()
    try:
        serie = dao.actualizarSerie(
            id_serie,
            data["titulo"],
            data["sinopsis"],
            data["temporada"]
        )
        if serie:
            return jsonify(serie_to_dict(serie)),200
        else:
            return jsonify({"error": "Seire no encontrada"}), 404
        
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}),500
    finally:
        session.close()

#DELETE
@app.route("/Serie/<id_serie>", methods=["DELETE"])
def eliminar_serie(id_serie):
    dao, session = get_dao()
    try:
        eliminado = dao.eliminarSerie(id_serie)
        if eliminado:
            return jsonify({"message": "Serie eliminada exitosamente"}), 200
        else:
            return jsonify({"error": "Serie no encontrada"}), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
