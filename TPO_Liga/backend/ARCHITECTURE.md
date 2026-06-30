# Documentación de Arquitectura Técnica

Este documento describe la arquitectura técnica, los patrones de diseño y el flujo de datos de la API backend de la Liga de Básquet Juvenil (TPO Liga). Está diseñado para servir como referencia técnica para las evaluaciones del proyecto universitario y la incorporación del equipo.

## 1. Arquitectura MVC Desacoplada

La aplicación adopta un patrón de diseño **Modelo-Vista-Controlador (MVC) Desacoplado**, adaptado para el desarrollo moderno de APIs RESTful.

*   **View (Vista Desacoplada)**: Dado que esta es una API REST backend, la capa "View" está completamente desacoplada. El servidor no renderiza HTML (como el MVC tradicional con Pug o EJS). En su lugar, emite datos JSON crudos. La Vista real es manejada por una aplicación cliente (ej., frontend web, app móvil) que consume estos endpoints de la API.
*   **Controller (Controlador)**: Los controladores (`src/controllers/`) actúan como intermediarios puros. Reciben las solicitudes HTTP desde las rutas (`src/routes/`), desestructuran los datos, validan la entrada básica y luego delegan el acceso a datos a la capa de Modelo. Finalmente, toman los datos devueltos por el Modelo y los envían al cliente. No contienen consultas SQL directas.
*   **Model (Modelo)**: La lógica del "Model" está centralizada en el directorio `src/models/`. Estas clases actúan como una capa de abstracción sobre la base de datos SQL Server, encapsulando todas las consultas SQL parametrizadas utilizando el paquete `mssql`. Sirven como la única capa de acceso a los datos.

## 2. Flujo de Datos de la Solicitud HTTP

El ciclo de vida de una solicitud HTTP entrante sigue un flujo de datos estricto y unidireccional:

1.  **Solicitud del Cliente**: Un cliente frontend envía una solicitud HTTP (ej., `GET /api/players/team/1`).
2.  **App Express (`app.js`)**: La solicitud llega a la aplicación Express, pasando a través de middlewares globales como `cors()` (para permitir solicitudes de origen cruzado) y `express.json()` (para analizar cargas útiles JSON).
3.  **Router (`src/routes/`)**: La aplicación Express reenvía la solicitud al router de la ruta apropiada (ej., `playerRoutes.js`) basándose en el prefijo de la URL.
4.  **Middleware de Ruta**: Si la ruta está protegida (como un `POST` o `DELETE`), la solicitud debe pasar primero por `authMiddleware`. Si la autenticación falla, el flujo se detiene aquí y devuelve un `401 Unauthorized`.
5.  **Controller (`src/controllers/`)**: La solicitud se entrega a la función específica del controlador (ej., `getPlayersByTeamId`). El controlador desestructura los parámetros (`req.params`) y las cargas útiles del cuerpo (`req.body`).
6.  **Capa de Modelo (`src/models/`)**: El controlador delega la operación a un modelo (ej., `PlayerModel.getByTeamId(teamId)`).
7.  **Conexión a Base de Datos**: El Modelo utiliza la `poolPromise` (`src/config/db.js`) para asegurar una conexión activa y ejecuta una consulta SQL parametrizada utilizando `mssql` (ej., `.input('TeamID', sql.Int, teamId)`), previniendo ataques de inyección SQL.
8.  **Respuesta de Base de Datos**: SQL Server ejecuta la consulta y devuelve un `recordset`.
9.  **Respuesta HTTP**: El modelo devuelve los datos al controlador, quien los formatea como JSON a través de `res.json()` y envía un código de estado HTTP 200/201 de vuelta al cliente.

## 3. Sistema de Autenticación con JSON Web Token (JWT)

La aplicación asegura los endpoints administrativos (crear, actualizar y eliminar registros) utilizando un sistema de autenticación JWT sin estado (stateless).

*   **Flujo de Inicio de Sesión**: Cuando un administrador envía credenciales a `/api/auth/login`, el `authController` consulta la base de datos en busca del usuario. Utiliza `bcrypt.compare()` para verificar de forma segura la contraseña en texto plano contra la contraseña hasheada en la base de datos.
*   **Generación de Token**: Si es válido, un payload que contiene el `adminId` se firma usando `jsonwebtoken` y una clave secreta (`JWT_SECRET`). Este token se envía de vuelta al cliente.
*   **Protección de Rutas**: Las rutas protegidas en el router utilizan el `authMiddleware`.
*   **Verificación**: Cuando un cliente solicita una ruta protegida, debe incluir el token en el encabezado HTTP `Authorization: Bearer <token>`. El `authMiddleware` intercepta la solicitud, extrae el token y verifica su firma criptográfica.
*   **Sin Estado (Statelessness)**: Debido a que el token contiene la firma y el payload, el servidor no necesita consultar la base de datos para verificar la sesión. Simplemente verifica la firma matemáticamente. Si es válido, el middleware inyecta el payload decodificado en `req.admin` y llama a `next()` para permitir que el controlador proceda.

## 4. Lógica de Negocio de la Tabla de Posiciones (Vista `v_Standings`)

En lugar de calcular la tabla de posiciones de los equipos dinámicamente dentro de la capa de la aplicación Node.js, la lógica de negocio se descarga directamente al motor de la base de datos utilizando una Vista SQL (`v_Standings`).

*   **Agregación a Nivel de Base de Datos**: La vista SQL cruza dinámicamente las categorías y los equipos de una temporada. Calcula los partidos jugados, victorias, derrotas y puntos utilizando sumatorias condicionales sobre la tabla `Matches`.
*   **Optimización del Rendimiento**: Al mantener esta lógica en la base de datos, el motor relacional optimiza el plan de ejecución. Evita que el servidor Node.js obtenga los partidos en memoria y los procese manualmente.
*   **Controlador Simplificado**: La lógica se abstrae completamente. El `StandingsModel` simplemente inyecta dinámicamente el filtro de temporada/categoría y realiza un `SELECT * FROM [v_Standings] WHERE SeasonID = @SeasonId ORDER BY Puntos DESC`.
*   **Única Fuente de Verdad**: Cualquier herramienta de informes, aplicación frontend o servicio secundario que consulte la vista `v_Standings` obtendrá cálculos idénticos sin duplicar el código de la lógica de negocio.
