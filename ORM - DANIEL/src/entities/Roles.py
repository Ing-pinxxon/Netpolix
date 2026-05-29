from src.dao.RolesDAO import RolesDAO
from src.config.database import SessionLocal


# ===== FUNCIONES AUXILIARES =====

def mostrar_roles(roles):
    """
    Muestra la lista de roles disponibles.
    :param roles: lista de objetos Rolee
    """
    if not roles:
        print("❌ No hay registros.")
    else:
        for r in roles:
            print(f"ID: {r.id_rol} | Nombre: {r.nombre}")


# ===== MENÚ PRINCIPAL PARA ROLES =====

def menu_roles():
    """
    Menú interactivo para administrar roles.
    Permite:
    1. Listar roles
    2. Crear rol
    3. Editar rol
    4. Eliminar rol
    5. Salir
    """
    while True:
        print("\n==== MENÚ ROLES =====")
        print("1. Listar roles")
        print("2. Crear rol")
        print("3. Editar rol")
        print("4. Eliminar rol")
        print("5. Salir")

        opcion = input("Seleccione una opción: ")

        session = SessionLocal()

        try:
            miDaoRoles = RolesDAO(session)

            # ===== OPCIÓN 1: LISTAR =====
            if opcion == "1":
                datos = miDaoRoles.obtenerRoles()
                mostrar_roles(datos)

            # ===== OPCIÓN 2: CREAR =====
            elif opcion == "2":
                id_rol = input("Digite el ID del rol: ")
                nombre = input("Digite el nombre del rol: ")

                miDaoRoles.crearRol(id_rol, nombre)
                print("✅ Rol creado")

            # ===== OPCIÓN 3: EDITAR =====
            elif opcion == "3":
                id_rol = input("Digite el ID del rol a editar: ")
                nuevo_nombre = input("Digite el nuevo nombre: ")

                if miDaoRoles.actualizarRol(id_rol, nuevo_nombre):
                    print("✅ Rol actualizado")
                else:
                    print("❌ No existe ese rol")

            # ===== OPCIÓN 4: ELIMINAR =====
            elif opcion == "4":
                id_rol = input("Digite el ID del rol a eliminar: ")

                if miDaoRoles.eliminarRol(id_rol):
                    print("✅ Rol eliminado")
                else:
                    print("❌ No existe ese rol")

            # ===== OPCIÓN 5: SALIR =====
            elif opcion == "5":
                print("👋 Saliendo del módulo...")
                break

            else:
                print("❌ Opción inválida")

        except Exception as e:
            print(f"❌ Error: {e}")

        finally:
            session.close()