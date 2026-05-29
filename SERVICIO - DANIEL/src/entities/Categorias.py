from flask import request, jsonify
from src.dao.CategoriasDAO import CategoriasDAO
from src.config.database import SessionLocal
from app import app


def get_dao():
    session = SessionLocal()
    return CategoriasDAO(session), session


def categoria_to_dict(categoria):
    return {
        "id_categoria": categoria.id_categoria,
        "nombre": categoria.nombre
    }


# ================= CREATE =================
@app.route("/Categoria", methods=["POST"])
def crear_categoria():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    for campo in ["id_categoria", "nombre"]:
        if campo not in data:
            return jsonify({"error": f"Falta el campo {campo}"}), 400

    dao, session = get_dao()

    try:
        categoria = dao.crearCategoria(
            data["id_categoria"],
            data["nombre"]
        )

        return jsonify(categoria_to_dict(categoria)), 201

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= READ ALL =================
@app.route("/Categoria", methods=["GET"])
def obtener_categorias():
    dao, session = get_dao()

    try:
        categorias = dao.obtenerCategorias()

        return jsonify([
            categoria_to_dict(c)
            for c in categorias
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= READ POR ID =================
@app.route("/Categoria/<id_categoria>", methods=["GET"])
def obtener_categoria_por_id(id_categoria):
    dao, session = get_dao()

    try:
        categoria = dao.obtenerCategoriaPorId(id_categoria)

        if categoria:
            return jsonify(categoria_to_dict(categoria)), 200
        else:
            return jsonify({"error": "Categoría no encontrada"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= UPDATE =================
@app.route("/Categoria/<id_categoria>", methods=["PUT"])
def actualizar_categoria(id_categoria):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron los datos"}), 400

    if "nombre" not in data:
        return jsonify({"error": "Falta el campo nombre"}), 400

    dao, session = get_dao()

    try:
        categoria = dao.actualizarCategoria(
            id_categoria,
            data["nombre"]
        )

        if categoria:
            return jsonify(categoria_to_dict(categoria)), 200
        else:
            return jsonify({"error": "Categoría no encontrada"}), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()


# ================= DELETE =================
@app.route("/Categoria/<id_categoria>", methods=["DELETE"])
def eliminar_categoria(id_categoria):
    dao, session = get_dao()

    try:
        eliminado = dao.eliminarCategoria(id_categoria)

        if eliminado:
            return jsonify({"message": "Categoría eliminada exitosamente"}), 200
        else:
            return jsonify({"error": "Categoría no encontrada"}), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()