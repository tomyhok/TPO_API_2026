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
Para tu comodidad, el proyecto incluye un entorno de ejecución concurrente en la raíz.

### Forma Rápida (Recomendada)
1. Abre una terminal en la carpeta raíz del proyecto (`/TPO_Liga`).
2. Instala todas las dependencias (el script `postinstall` se encargará de instalar automáticamente las del frontend y backend): `npm install`
3. Inicia ambos servidores simultáneamente: `npm run dev`
4. La interfaz web se abrirá automáticamente o estará disponible en `http://localhost:5173`. El backend estará escuchando en `http://localhost:3000`.

### Forma Manual (Independiente)
Si deseas levantar los entornos por separado para ver los logs aislados:
- **Backend:** `cd backend`, `npm install`, luego `npm run dev`.
- **Frontend:** `cd frontend`, `npm install`, luego `npm run dev`.

---

## Credenciales de Prueba

Para propósitos de evaluación y para acceder al panel de administración completo (CRUD de equipos, jugadores, creación de temporadas y carga de resultados), utilice las siguientes credenciales de prueba provistas por defecto en la base de datos:

- **Usuario:** `admin`
- **Contraseña:** `TPO_Admin_2026`

Al iniciar sesión desde la ruta `/login` en la web, el sistema validará el acceso contra la base de datos y le otorgará un token JWT seguro.
