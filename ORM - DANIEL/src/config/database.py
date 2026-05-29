from __future__ import annotations

import os
import re
from urllib.parse import quote_plus

from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

# Credenciales: tu contraseña de MySQL (o vacío si root no tiene contraseña)
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
_raw_db = os.getenv("MYSQL_DATABASE", "bd_netpolix")
MYSQL_DATABASE = _raw_db if re.fullmatch(r"[A-Za-z0-9_]+", _raw_db) else "bd_netpolix"


def _mysql_connection_url(*, database: str | None = None) -> str:
    user = quote_plus(MYSQL_USER)
    if MYSQL_PASSWORD:
        auth = f"{user}:{quote_plus(MYSQL_PASSWORD)}"
    else:
        auth = f"{user}:"
    path = f"/{database}" if database else ""
    return f"mysql+mysqlconnector://{auth}@{MYSQL_HOST}:{MYSQL_PORT}{path}"


# ===== 1. CREAR BASE DE DATOS SI NO EXISTE =====
server_connection = _mysql_connection_url()
engine_server = create_engine(server_connection)

with engine_server.connect() as connection:
    connection.execute(text(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}`"))
    print("✅ Base de datos lista")

# ===== 2. CONECTAR A LA BD =====
connection_string = _mysql_connection_url(database=MYSQL_DATABASE)
engine = create_engine(connection_string, echo=True)

SessionLocal = sessionmaker(bind=engine)

# ===== 3. MODELOS =====
class Rolee(Base):
    __tablename__ = 'roles'

    id_rol = Column(String(10), primary_key=True)
    nombre = Column(String(255), nullable=False)


class Series(Base):
    __tablename__ = 'series'

    id_serie = Column(String(10), primary_key=True)
    titulo = Column(String(50), nullable=False)
    sipnosis = Column(String(255), nullable=False)
    temporada = Column(Integer, nullable=False)


# ===== 4. CREAR TABLAS =====
Base.metadata.create_all(engine)
print("✅ Tablas creadas")