from src.config.database import Categorias
from sqlalchemy.orm import Session

class CategoriasDAO:
    
    def __init__(self, db_sesion: Session):
        self.db = db_sesion

    # ===== CREATE =====
    def crearCategoria(self, id_categoria, nombre):
        nueva = Categorias(
            id_categoria=id_categoria,
            nombre=nombre
        )
        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)
        return nueva

    # ===== READ POR ID =====
    def obtenerCategoriaPorId(self, id_categoria):
        return self.db.query(Categorias)\
            .filter(Categorias.id_categoria == id_categoria)\
            .first()

    # ===== READ (TODOS) =====
    def obtenerCategorias(self):
        return self.db.query(Categorias).all()

    # ===== UPDATE =====
    def actualizarCategoria(self, id_categoria, nuevo_nombre):
        categoria = self.obtenerCategoriaPorId(id_categoria)

        if categoria:
            categoria.nombre = nuevo_nombre
            self.db.commit()
            self.db.refresh(categoria)

        return categoria

    # ===== DELETE =====
    def eliminarCategoria(self, id_categoria):
        categoria = self.obtenerCategoriaPorId(id_categoria)

        if categoria:
            self.db.delete(categoria)
            self.db.commit()
            return True

        return False