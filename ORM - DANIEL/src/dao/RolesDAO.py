from src.config.database import Rolee
from sqlalchemy.orm import Session

class RolesDAO:
    """
    Clase DAO (Data Access Object) para manejar los registros de Roles en la base de datos
    usando SQLAlchemy. Permite crear, consultar, actualizar y eliminar roles.
    """

    def __init__(self, db_sesion: Session):
        """
        Constructor de la clase.

        :param db_sesion: Sesión activa de SQLAlchemy para la base de datos.
        """
        self.db = db_sesion

    # ===== CREATE =====
    def crearRol(self, id_rol, nombre):
        """
        Crea un nuevo rol en la base de datos.

        :param id_rol: Identificador único del rol.
        :param nombre: Nombre del rol.
        :return: Objeto Rolee creado.
        """
        nuevo = Rolee(
            id_rol=id_rol,
            nombre=nombre
        )
        self.db.add(nuevo)        # Agrega el objeto a la sesión
        self.db.commit()          # Guarda en la BD
        self.db.refresh(nuevo)    # Refresca con datos actuales
        return nuevo

    # ===== READ (uno) =====
    def obtenerRolPorId(self, id_rol):
        """
        Obtiene un rol por su ID.

        :param id_rol: Identificador único del rol.
        :return: Objeto Rolee o None si no existe.
        """
        return self.db.query(Rolee)\
            .filter(Rolee.id_rol == id_rol)\
            .first()

    # ===== READ (todos) =====
    def obtenerRoles(self):
        """
        Obtiene todos los roles.

        :return: Lista de objetos Rolee.
        """
        return self.db.query(Rolee).all()

    # ===== UPDATE =====
    def actualizarRol(self, id_rol, nuevo_nombre=None):
        """
        Actualiza el nombre de un rol existente.

        :param id_rol: ID del rol a actualizar.
        :param nuevo_nombre: Nuevo nombre del rol.
        :return: Objeto actualizado o None si no existe.
        """
        rol = self.obtenerRolPorId(id_rol)
        if rol:
            if nuevo_nombre is not None:
                rol.nombre = nuevo_nombre
            self.db.commit()
            self.db.refresh(rol)
        return rol

    # ===== DELETE =====
    def eliminarRol(self, id_rol):
        """
        Elimina un rol de la base de datos.

        :param id_rol: ID del rol a eliminar.
        :return: True si se eliminó, False si no existía.
        """
        rol = self.obtenerRolPorId(id_rol)
        if rol:
            self.db.delete(rol)
            self.db.commit()
            return True
        return False