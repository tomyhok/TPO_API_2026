# Documentación de Arquitectura Técnica

Este documento describe la arquitectura técnica, los patrones de diseño y el flujo de datos de la API backend de la Liga de Básquet Juvenil (TPO Liga). Está diseñado para servir como referencia técnica para las evaluaciones del proyecto universitario y la incorporación del equipo.

## 1. Arquitectura MVC Desacoplada

La aplicación adopta un patrón de diseño **Modelo-Vista-Controlador (MVC) Desacoplado**, adaptado para el desarrollo moderno de APIs RESTful.

*   **View (Vista Desacoplada)**: Dado que esta es una API REST backend, la capa "View" está completamente desacoplada. El servidor no renderiza HTML (como el MVC tradicional con Pug o EJS). En su lugar, emite datos JSON crudos. La Vista real es manejada por una aplicación frontend separada (ej., React, Vue o Angular) que consume estos endpoints de la API.
*   **Controller (Controlador)**: La lógica del Controlador se divide entre **Routes** (`src/routes/`) y **Controllers** (`src/controllers/`). Las Routes mapean los verbos HTTP y las rutas URL a funciones específicas, actuando como directores de tráfico. Los Controllers contienen la lógica real de la aplicación, analizando los datos de la solicitud y determinando qué respuesta enviar.
*   **Model (Modelo)**: La lógica del "Model" se delega en gran medida a la **Base de Datos SQL Server**. En lugar de usar un ORM (Mapeador Objeto-Relacional) pesado como Sequelize o TypeORM, la aplicación utiliza consultas SQL crudas y Vistas de Base de Datos. El esquema de la base de datos, las restricciones y las vistas sirven como el verdadero Modelo, asegurando la integridad de los datos al nivel más bajo.

## 2. Flujo de Datos de la Solicitud HTTP

El ciclo de vida de una solicitud HTTP entrante sigue un flujo de datos estricto y unidireccional:

1.  **Solicitud del Cliente**: Un cliente frontend envía una solicitud HTTP (ej., `GET /api/players/team/1`).
2.  **App Express (`app.js`)**: La solicitud llega a la aplicación Express, pasando a través de middlewares globales como `cors()` (para permitir solicitudes de origen cruzado) y `express.json()` (para analizar cargas útiles JSON).
3.  **Router (`src/routes/`)**: La aplicación Express reenvía la solicitud al router de la ruta apropiada (ej., `playerRoutes.js`) basándose en el prefijo de la URL.
4.  **Middleware de Ruta**: Si la ruta está protegida (como un `POST` o `DELETE`), la solicitud debe pasar primero por `authMiddleware`. Si la autenticación falla, el flujo se detiene aquí y devuelve un `401 Unauthorized`.
5.  **Controller (`src/controllers/`)**: La solicitud se entrega a la función específica del controlador (ej., `getPlayersByTeamId`). El controlador desestructura los parámetros (`req.params`) y las cargas útiles del cuerpo (`req.body`).
6.  **Conexión a Base de Datos (`src/config/db.js`)**: El controlador espera la `poolPromise` para asegurar una conexión activa a la base de datos SQL Server.
7.  **Ejecución de Consulta**: El controlador ejecuta una consulta SQL parametrizada (ej., `.input('TeamID', sql.Int, teamId)`) utilizando el paquete `mssql`. La vinculación de parámetros se utiliza para prevenir ataques de Inyección SQL.
8.  **Respuesta de Base de Datos**: SQL Server ejecuta la consulta y devuelve un `recordset` (un array de filas).
9.  **Respuesta HTTP**: El controlador toma el `recordset` de la base de datos, lo serializa en una cadena JSON a través de `res.json()` y envía un código de estado HTTP 200/201 de vuelta al cliente.

## 3. Sistema de Autenticación con JSON Web Token (JWT)

La aplicación asegura los endpoints administrativos (crear, actualizar y eliminar registros) utilizando un sistema de autenticación JWT sin estado (stateless).

*   **Flujo de Inicio de Sesión**: Cuando un administrador envía credenciales a `/api/auth/login`, el `authController` consulta la base de datos en busca del usuario. Utiliza `bcrypt.compare()` para verificar de forma segura la contraseña en texto plano contra la contraseña hasheada en la base de datos.
*   **Generación de Token**: Si es válido, un payload que contiene el `adminId` se firma usando `jsonwebtoken` y una clave secreta (`JWT_SECRET`). Este token se envía de vuelta al cliente.
*   **Protección de Rutas**: Las rutas protegidas en el router utilizan el `authMiddleware`.
*   **Verificación**: Cuando un cliente solicita una ruta protegida, debe incluir el token en el encabezado HTTP `Authorization: Bearer <token>`. El `authMiddleware` intercepta la solicitud, extrae el token y verifica su firma criptográfica.
*   **Sin Estado (Statelessness)**: Debido a que el token contiene la firma y el payload, el servidor no necesita consultar la base de datos para verificar la sesión. Simplemente verifica la firma matemáticamente. Si es válido, el middleware inyecta el payload decodificado en `req.admin` y llama a `next()` para permitir que el controlador proceda.

## 4. Lógica de Negocio de la Tabla de Posiciones (Vista `v_Standings`)

En lugar de calcular la tabla de posiciones de los equipos dinámicamente dentro de la capa de la aplicación Node.js, la lógica de negocio se descarga directamente al motor de la base de datos utilizando una Vista SQL (`v_Standings`).

*   **Agregación a Nivel de Base de Datos**: La vista SQL es responsable de agregar los datos de los partidos. Calcula el total de partidos jugados, victorias, derrotas y empates para cada equipo basándose en los `LocalPoints` y `VisitorPoints` almacenados en la tabla `Matches`.
*   **Optimización del Rendimiento**: Al mantener esta lógica en la base de datos, el motor relacional puede optimizar el plan de ejecución. Evita que el servidor Node.js tenga que obtener cientos de partidos en memoria y recorrerlos para calcular los puntos.
*   **Controlador Simplificado**: Debido a que la lógica se abstrae en la Vista, el `standingsController` es increíblemente ligero. Simplemente ejecuta `SELECT * FROM [v_Standings] ORDER BY [Puntos] DESC`.
*   **Única Fuente de Verdad**: Cualquier herramienta de informes, aplicación frontend o servicio secundario que consulte la vista `v_Standings` obtendrá cálculos idénticos sin duplicar el código de la lógica de negocio.
