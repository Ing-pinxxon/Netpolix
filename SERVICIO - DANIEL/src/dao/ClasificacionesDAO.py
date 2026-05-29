from src.config.database import Clasificaciones
from sqlalchemy.orm import Session

class ClasificacionesDAO:
    """
    Clase DAO (Data Access Object) para manejar operaciones CRUD
    sobre la tabla 'Clasificaciones' usando SQLAlchemy.
    """

    def __init__(self, db_sesion: Session):
        """
        Constructor de la clase.

        :param db_sesion: Sesión activa de SQLAlchemy para la base de datos.
        """
        self.db = db_sesion

    # ===== CREATE =====
    def crearClasificacion(self, tipo, descripcion):
        """
        Crea una nueva clasificación en la base de datos.

        :param tipo: Tipo de la clasificación (clave primaria).
        :param descripcion: Descripción de la clasificación.
        :return: Objeto Clasificaciones creado.
        """
        nueva = Clasificaciones(
            tipo=tipo,
            descripcion=descripcion
        )
        self.db.add(nueva)         # Agregar la nueva clasificación a la sesión
        self.db.commit()            # Guardar cambios en la base de datos
        self.db.refresh(nueva)      # Refrescar el objeto con los datos de la DB
        return nueva

    # ===== READ (uno) =====
    def obtenerClasificacionPorId(self, tipo):
        """
        Obtiene una clasificación por su tipo.

        :param tipo: Tipo de la clasificación a buscar.
        :return: Objeto Clasificaciones si existe, None si no.
        """
        return self.db.query(Clasificaciones)\
            .filter(Clasificaciones.tipo == tipo)\
            .first()

    # ===== READ (todos) =====
    def obtenerClasificaciones(self):
        """
        Obtiene todas las clasificaciones existentes en la base de datos.

        :return: Lista de objetos Clasificaciones.
        """
        return self.db.query(Clasificaciones).all()

    # ===== UPDATE =====
    def actualizarClasificacion(self, tipo, nueva_descripcion):
        """
        Actualiza la descripción de una clasificación existente.

        :param tipo: Tipo de la clasificación a actualizar.
        :param nueva_descripcion: Nueva descripción para la clasificación.
        :return: Objeto Clasificaciones actualizado o None si no existe.
        """
        clasificacion = self.obtenerClasificacionPorId(tipo)

        if clasificacion:
            clasificacion.descripcion = nueva_descripcion
            self.db.commit()        # Guardar cambios en la base de datos
            self.db.refresh(clasificacion)

        return clasificacion

    # ===== DELETE =====
    def eliminarClasificacion(self, tipo):
        """
        Elimina una clasificación de la base de datos.

        :param tipo: Tipo de la clasificación a eliminar.
        :return: True si se eliminó, False si no existe.
        """
        clasificacion = self.obtenerClasificacionPorId(tipo)

        if clasificacion:
            self.db.delete(clasificacion)  # Eliminar de la sesión
            self.db.commit()               # Guardar cambios en la base de datos
            return True

        return False