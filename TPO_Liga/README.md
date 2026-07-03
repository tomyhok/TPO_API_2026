# TPO Liga Juvenil de Básquet

Bienvenido al repositorio oficial del **Trabajo Práctico Obligatorio (TPO)** de la materia. Este proyecto es una plataforma web integral para la gestión de una Liga de Básquet Juvenil, cumpliendo con todos los requerimientos funcionales y no funcionales exigidos en la consigna.

La plataforma permite administrar equipos, jugadores, partidos, resultados y visualizar la clasificación general del torneo de forma automática, soportando múltiples temporadas y divisiones (categorías).

## Stack Tecnológico

El proyecto cumple estrictamente con las tecnologías solicitadas:
- **Frontend**: HTML/CSS, JavaScript, **React** (utilizando Vite como bundler) y Tailwind CSS para el diseño responsive.
- **Backend**: **NodeJS** con Express.
- **Base de Datos**: **SQL Server** (alojada en Azure), aprovechando las capacidades del motor relacional mediante Vistas (`v_Standings`) para el cálculo de estadísticas.

## Estructura del Proyecto

El repositorio está dividido en dos aplicaciones principales y una carpeta de documentación:
- `/frontend`: Contiene el código fuente de la aplicación React (Single Page Application).
- `/backend`: Contiene el código de la API RESTful en Node.js, y los scripts de base de datos.
- `/docs`: Contiene la Documentación Técnica y el Manual de Usuario.

> **Importante**: Para entender la arquitectura, el modelado de datos y el detalle de los Endpoints, por favor lee la [Documentación Técnica](docs/DOCUMENTACION_TECNICA.md). Si deseas conocer el uso de la aplicación, lee el [Manual de Usuario](docs/MANUAL_USUARIO.md).

---

## Instrucciones de Instalación y Ejecución

Para poder evaluar el proyecto localmente, es necesario levantar ambos servidores (Frontend y Backend).

### 1. Levantar el Backend (API REST)
1. Abre una terminal y navega a la carpeta del backend: `cd backend`
2. Instala las dependencias: `npm install`
3. Asegúrate de tener el archivo `.env` configurado (el código entregado ya incluye la conexión a la base de datos de prueba en Azure).
4. Inicia el servidor de desarrollo: `npm run dev`
5. La API estará escuchando peticiones (típicamente en `http://localhost:3000`).

### 2. Levantar el Frontend (Cliente React)
1. Abre una nueva terminal y navega a la carpeta del frontend: `cd frontend`
2. Instala las dependencias: `npm install`
3. Inicia el servidor de desarrollo de Vite: `npm run dev`
4. Abre la URL que indica la terminal (usualmente `http://localhost:5173`) en tu navegador web.

---

## Credenciales de Prueba

Para propósitos de evaluación y para acceder al panel de administración completo (CRUD de equipos, jugadores, creación de temporadas y carga de resultados), utilice las siguientes credenciales de prueba provistas por defecto en la base de datos:

- **Usuario:** `admin`
- **Contraseña:** `TPO_Admin_2026`

Al iniciar sesión desde la ruta `/login` en la web, el sistema validará el acceso contra la base de datos y le otorgará un token JWT seguro.
