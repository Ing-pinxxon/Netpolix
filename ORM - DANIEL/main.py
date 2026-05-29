from src.config.database import engine, Base
from src.entities.Roles import menu_roles
from src.entities.Series import menu_series

# ================= MENÚ PRINCIPAL =================
def menu_principal():
    """
    Menú principal de la aplicación.
    Permite acceder a los módulos de clasificaciones y idiomas.
    """
    while True:
        print("\n========= MENÚ PRINCIPAL =========")
        print("1. Roles")
        print("2. Series")
        print("3. Salir")

        opcion = input("Seleccione una opción: ")

        if opcion == "1":
            menu_roles() # Entrar al menú de clasificaciones

        elif opcion == "2":
            menu_series()  # Entrar al menú de idiomas

        elif opcion == "3":
            print("👋 Saliendo de la aplicación...")
            break

        else:
            print("❌ Opción inválida. Intente nuevamente.")


# ================= EJECUCIÓN PRINCIPAL =================
if __name__ == "__main__":
    print("🔌 Inicializando base de datos...")
    # Crear todas las tablas definidas en Base metadata si no existen
    Base.metadata.create_all(bind=engine)

    try:
        # Ejecutar el menú principal
        menu_principal()
    finally:
        # 🔒 Cierre de sesión global si la estás usando
        # Nota: Solo si tienes definida una sesión global llamada `session`
        try:
            session.close()
        except NameError:
            pass