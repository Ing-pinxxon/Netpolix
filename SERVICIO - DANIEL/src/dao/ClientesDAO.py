from src.config.database import Clientes
from sqlalchemy.orm import Session


class ClientesDAO:

    def __init__(self, db_sesion: Session):
        self.db = db_sesion

    # ===== CREATE =====
    def crearCliente(self, id_cliente, nombre, apellido, email, password):
        nuevo = Clientes(
            id_cliente=id_cliente,
            nombre=nombre,
            apellido=apellido,
            email=email,
            password=password
        )
        self.db.add(nuevo)
        self.db.commit()
        self.db.refresh(nuevo)
        return nuevo

    # ===== READ POR ID =====
    def obtenerClientePorId(self, id_cliente):
        return self.db.query(Clientes)\
            .filter(Clientes.id_cliente == id_cliente)\
            .first()

    # ===== READ TODOS =====
    def obtenerClientes(self):
        return self.db.query(Clientes).all()

    # ===== UPDATE =====
    def actualizarCliente(self, id_cliente, nombre=None, apellido=None, email=None, password=None):
        cliente = self.obtenerClientePorId(id_cliente)

        # 🔴 FIX: era "clientes", debe ser "cliente"
        if cliente:
            if nombre is not None:
                cliente.nombre = nombre
            if apellido is not None:
                cliente.apellido = apellido
            if email is not None:
                cliente.email = email
            if password is not None:
                cliente.password = password

            self.db.commit()
            self.db.refresh(cliente)

        return cliente

    # ===== DELETE =====
    def eliminarCliente(self, id_cliente):
        cliente = self.obtenerClientePorId(id_cliente)

        if cliente:
            self.db.delete(cliente)
            self.db.commit()
            return True

        return False