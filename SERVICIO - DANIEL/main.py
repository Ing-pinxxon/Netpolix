from app import app

import src.entities.Clasificaciones
import src.entities.Categorias
import src.entities.Clientes
import src.entities.Series
import src.entities.Roles





@app.route("/")
def inicio():
    return "Servidor funcionando"


if __name__ == "__main__":
    app.run(debug=True, port=5000)