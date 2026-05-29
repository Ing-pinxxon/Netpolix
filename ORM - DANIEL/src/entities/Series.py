from src.dao.SeriesDAO import SeriesDAO
from src.config.database import SessionLocal


# ===== FUNCIONES AUXILIARES =====

def mostrar_series(series):
    """
    Muestra la lista de series disponibles.
    :param series: lista de objetos Series
    """
    if not series:
        print("❌ No hay registros.")
    else:
        for s in series:
            print(f"ID: {s.id_serie} | Titulo: {s.titulo} | "
                  f"Sinopsis: {s.sipnosis} | Temporada: {s.temporada}")


# ===== MENÚ PRINCIPAL PARA SERIES =====

def menu_series():
    """
    Menú interactivo para administrar series.
    Permite:
    1. Listar series
    2. Crear serie
    3. Editar serie
    4. Eliminar serie
    5. Salir
    """
    while True:
        print("\n==== MENÚ SERIES =====")
        print("1. Listar series")
        print("2. Crear serie")
        print("3. Editar serie")
        print("4. Eliminar serie")
        print("5. Salir")

        opcion = input("Seleccione una opción: ")

        session = SessionLocal()

        try:
            miDaoSeries = SeriesDAO(session)

            # ===== OPCIÓN 1: LISTAR =====
            if opcion == "1":
                datos = miDaoSeries.obtenerSeries()
                mostrar_series(datos)

            # ===== OPCIÓN 2: CREAR =====
            elif opcion == "2":
                id_serie = input("Digite el ID de la serie: ")
                titulo = input("Digite el título: ")
                sipnosis = input("Digite la sinopsis: ")
                temporada = int(input("Digite la temporada: "))

                miDaoSeries.crearSerie(id_serie, titulo, sipnosis, temporada)
                print("✅ Serie creada")

            # ===== OPCIÓN 3: EDITAR =====
            elif opcion == "3":
                id_serie = input("Digite el ID de la serie a editar: ")

                print("Deje vacío si no desea cambiar un campo")

                titulo = input("Nuevo título: ")
                sipnosis = input("Nueva sinopsis: ")
                temporada_input = input("Nueva temporada: ")

                temporada = int(temporada_input) if temporada_input else None

                # Convertir vacíos a None
                titulo = titulo if titulo else None
                sipnosis = sipnosis if sipnosis else None

                resultado = miDaoSeries.actualizarSerie(
                    id_serie,
                    titulo,
                    sipnosis,
                    temporada
                )

                if resultado:
                    print("✅ Serie actualizada")
                else:
                    print("❌ No existe esa serie")

            # ===== OPCIÓN 4: ELIMINAR =====
            elif opcion == "4":
                id_serie = input("Digite el ID de la serie a eliminar: ")

                if miDaoSeries.eliminarSerie(id_serie):
                    print("✅ Serie eliminada")
                else:
                    print("❌ No existe esa serie")

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