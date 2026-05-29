from src.config.database import Series
from sqlalchemy.orm import Session

class SeriesDAO:
    """
    Clase DAO para manejar los registros de Series en la base de datos.
    Permite crear, consultar, actualizar y eliminar series.
    """

    def __init__(self, db_sesion: Session):
        """
        Constructor de la clase.

        :param db_sesion: Sesión activa de SQLAlchemy.
        """
        self.db = db_sesion

    # ===== CREATE =====
    def crearSerie(self, id_serie, titulo, sipnosis, temporada):
        """
        Crea una nueva serie.

        :param id_serie: ID de la serie.
        :param titulo: Título de la serie.
        :param sipnosis: Descripción/sinopsis.
        :param temporada: Número de temporada.
        :return: Objeto Series creado.
        """
        nueva = Series(
            id_serie=id_serie,
            titulo=titulo,
            sipnosis=sipnosis,
            temporada=temporada
        )
        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)
        return nueva

    # ===== READ (uno) =====
    def obtenerSeriePorId(self, id_serie):
        """
        Obtiene una serie por su ID.

        :param id_serie: ID de la serie.
        :return: Objeto Series o None.
        """
        return self.db.query(Series)\
            .filter(Series.id_serie == id_serie)\
            .first()

    # ===== READ (todos) =====
    def obtenerSeries(self):
        """
        Obtiene todas las series.

        :return: Lista de Series.
        """
        return self.db.query(Series).all()

    # ===== UPDATE =====
    def actualizarSerie(self, id_serie, titulo=None, sipnosis=None, temporada=None):
        """
        Actualiza una serie existente.

        :param id_serie: ID de la serie.
        :param titulo: Nuevo título (opcional).
        :param sipnosis: Nueva sinopsis (opcional).
        :param temporada: Nueva temporada (opcional).
        :return: Objeto actualizado o None.
        """
        serie = self.obtenerSeriePorId(id_serie)

        if serie:
            if titulo is not None:
                serie.titulo = titulo
            if sipnosis is not None:
                serie.sipnosis = sipnosis
            if temporada is not None:
                serie.temporada = temporada

            self.db.commit()
            self.db.refresh(serie)

        return serie

    # ===== DELETE =====
    def eliminarSerie(self, id_serie):
        """
        Elimina una serie.

        :param id_serie: ID de la serie.
        :return: True si se eliminó, False si no existe.
        """
        serie = self.obtenerSeriePorId(id_serie)

        if serie:
            self.db.delete(serie)
            self.db.commit()
            return True

        return False