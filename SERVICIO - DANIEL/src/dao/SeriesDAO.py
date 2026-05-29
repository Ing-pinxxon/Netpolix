from src.config.database import Series
from sqlalchemy.orm import Session

class SeriesDAO:
    
    def __init__(self, db_sesion: Session):
        self.db = db_sesion
    
    #CREATE
    def crearSerie(self, id_serie, titulo, sinopsis, temporada):
        nueva= Series(
            id_serie = id_serie,
            titulo = titulo,
            sinopsis = sinopsis,
            temporada = temporada
        )
        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)
        return nueva
    
    #READ POR ID
    def obtenerSeriePorId(self, id_serie):
        return self.db.query(Series)\
            .filter(Series.id_serie == id_serie)\
            .first()
    
    #READ (TODOS)
    def obtenerSeries(self):
        return self.db.query(Series).all()
    
    #UPDATE
    def actualizarSerie(self, id_serie, nuevo_titulo, nuevo_sinopsis, nueva_tempora):
        
        serie = self.obtenerSeriePorId(id_serie)
        
        if serie:
            serie.titulo = nuevo_titulo
            serie.sinopsis = nuevo_sinopsis
            serie.temporada = nueva_tempora
            self.db.commit()
            self.db.refresh(serie)
        return serie
    
    #DELETE
    def eliminarSerie(self, id_serie):
        serie = self.obtenerSeriePorId(id_serie)
        if serie:
            self.db.delete(serie)
            self.db.commit()
            return True
        return False
            
    