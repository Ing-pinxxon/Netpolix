# Netpolix 🎬

> Arquitectura Backend modular para la plataforma Netpolix, dividida en capas independientes para el manejo de persistencia (ORM) y lógica de negocio (Servicios).

---

## 📐 Estructura del Workspace

El proyecto utiliza el archivo de configuración `ORM - DANIEL.code-workspace` para gestionar los siguientes módulos independientes:

* **`ORM - DANIEL/`**: Capa de persistencia, encargada de los modelos de datos, esquemas y la comunicación directa con la base de datos.
* **`SERVICIO - DANIEL/`**: Capa de servicios, encargada de la lógica de negocio, controladores y la exposición de los endpoints de la API.

---

## 📦 Instalación y Configuración

Sigue estos pasos para levantar el entorno de desarrollo local:

### 1. Clonar el repositorio
```bash
git clone git@github.com:Ing-pinxxon/Netpolix.git
cd Netpolix
```

### 2. Configurar la persistencia (`ORM - DANIEL`)
```bash
cd "ORM - DANIEL"
npm install
```
*(Configura tu archivo de variables de entorno `.env` en esta carpeta con las credenciales de tu base de datos antes de continuar).*

### 3. Configurar la lógica (`SERVICIO - DANIEL`)
Abre una nueva terminal en la raíz del proyecto y ejecuta:

```bash
cd "SERVICIO - DANIEL"
npm install
npm run dev
```

---

## 👥 Autor

* **Daniel Felipe Pinzon Rodríguez** - [*Ing-pinxxon*](https://github.com/Ing-pinxxon)

---
Desarrollado bajo una arquitectura limpia y modular. 💻🚀

