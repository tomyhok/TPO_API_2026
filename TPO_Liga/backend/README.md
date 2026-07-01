# API de la Liga de Básquet Juvenil

Esta es la API backend para la plataforma de la Liga de Básquet Juvenil, construida para gestionar equipos, partidos y estadísticas de la liga. Este servicio proporciona los endpoints principales necesarios para crear, obtener, actualizar y eliminar información de equipos, y se conecta a una base de datos SQL Server.

## Stack Tecnológico

- **Node.js**: Entorno de ejecución de JavaScript.
- **Express.js**: Framework web rápido, sin opiniones y minimalista para Node.js.
- **SQL Server**: Sistema de gestión de bases de datos relacionales.
- **mssql**: Cliente de Microsoft SQL Server para Node.js.
- **dotenv**: Módulo para cargar variables de entorno desde un archivo `.env`.
- **cors**: Middleware para habilitar el Intercambio de Recursos de Origen Cruzado (CORS).

## Estructura del Proyecto

Nuestra carpeta `src` está organizada de la siguiente manera:

```text
src/
├── config/
│   └── db.js               # Configuración de conexión a la base de datos SQL Server usando mssql
├── controllers/            # Controladores HTTP (Manejan req, res y llaman a Models)
│   ├── authController.js
│   ├── categoryController.js
│   ├── matchController.js
│   ├── playerController.js
│   ├── seasonController.js
│   ├── standingsController.js
│   └── teamController.js
├── middlewares/            # Middlewares personalizados de Express
│   └── authMiddleware.js   # Middleware de verificación JWT
├── models/                 # Modelos de bases de datos (Contienen todas las consultas SQL)
│   ├── Category.js
│   ├── Match.js
│   ├── Player.js
│   ├── Season.js
│   ├── Standing.js
│   ├── Team.js
│   └── User.js
├── routes/                 # Rutas de la API (Redirigen las peticiones a los Controllers)
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── matchRoutes.js
│   ├── playerRoutes.js
│   ├── seasonRoutes.js
│   ├── standingsRoutes.js
│   └── teamRoutes.js
├── scripts/
│   ├── seedAdmin.js        # Script para crear el usuario administrador inicial
├── app.js                  # Configuración de la aplicación Express, aplicando middlewares y rutas
└── server.js               # Punto de entrada de la aplicación, inicia el servidor HTTP
```

## Configuración y Ejecución

Siga estas instrucciones paso a paso para configurar el entorno y ejecutar el servidor localmente.

### 1. Configurar las Variables de Entorno

Cree un archivo llamado `.env` en la raíz del directorio `backend` (si aún no existe) y configure los ajustes de su base de datos. Su archivo `.env` debería verse así:

```env
PORT=3000
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=YouthBasketballLeague

JWT_SECRET=supersecret_youth_league_key
```
> **Nota**: Ajuste los valores de `DB_SERVER`, `DB_PORT` y `DB_NAME` para que coincidan con su instancia local de SQL Server.

### 2. Instalar Dependencias

Asegúrese de tener Node.js instalado, luego instale las dependencias requeridas:

```bash
npm install
```

### 3. Ejecutar el Servidor

Para iniciar el servidor en modo de desarrollo usando `nodemon` (que reiniciará automáticamente el servidor tras cambios en los archivos):

```bash
npm run dev
```

Debería ver una salida indicando que el servidor se está ejecutando en el puerto 3000 y se ha conectado exitosamente a la base de datos.

## Requisito de Autenticación

> **Nota de Seguridad**: Todos los endpoints `POST`, `PUT` y `DELETE` requieren un encabezado `Authorization: Bearer <token>`. Puede obtener un token iniciando sesión a través del endpoint `/api/auth/login`. Los endpoints `GET` son públicos y no requieren autenticación.

## Endpoints de la API Teams

La API proporciona endpoints bajo el prefijo `/api/teams` para gestionar equipos de básquet.

### 1. Obtener Todos los Equipos
- **URL**: `/api/teams?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera una lista de todos los equipos en la liga. El `seasonId` es opcional (usa la activa por defecto).
- **Respuesta Exitosa**: `200 OK` (Devuelve un array de objetos de equipo)

### 2. Obtener Equipo por ID
- **URL**: `/api/teams/:id?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera un equipo específico por su ID entero, incluyendo su plantel y partidos en la temporada.
- **Respuesta Exitosa**: `200 OK` (Devuelve un único objeto de equipo con `.Players`, `.PlayedMatches` y `.PendingMatches`)
- **Respuesta de Error**: `404 Not Found` (Si el ID del equipo no existe)

### 3. Crear un Equipo
- **URL**: `/api/teams`
- **Method**: `POST`
- **Descripción**: Crea un nuevo equipo en la base de datos.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "Name": "Golden Eagles",
    "Coach": "John Doe",
    "LogoURL": "https://ejemplo.com/logo.png",
    "StadiumName": "Eagle Arena",
    "seasonId": 1
  }
  ```
- **Respuesta Exitosa**: `201 Created` (Devuelve el objeto de equipo recién creado)
- **Respuesta de Error**: `400 Bad Request` (Si faltan `Name` o `Coach`), `401 Unauthorized` (Si el token falta o es inválido)

### 4. Actualizar un Equipo
- **URL**: `/api/teams/:id`
- **Method**: `PUT`
- **Descripción**: Actualiza el Nombre o Entrenador de un equipo existente.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "Name": "Silver Hawks",
    "LogoURL": "https://ejemplo.com/new_logo.png"
  }
  ```
  *(Puede proporcionar `Name`, `Coach`, `LogoURL` o `StadiumName`).*
- **Respuesta Exitosa**: `200 OK` (Devuelve el objeto de equipo actualizado)
- **Respuesta de Error**: `400 Bad Request` (Si no se proporcionan campos para actualizar), `404 Not Found` (Si el ID del equipo no existe), `401 Unauthorized` (Si el token falta o es inválido)

### 5. Eliminar un Equipo
- **URL**: `/api/teams/:id`
- **Method**: `DELETE`
- **Descripción**: Elimina un equipo de la base de datos por su ID.
- **Respuesta Exitosa**: `200 OK` (Devuelve `{"message": "Team deleted successfully."}`)
- **Respuesta de Error**: `404 Not Found` (Si el ID del equipo no existe), `401 Unauthorized` (Si el token falta o es inválido)

## Endpoints de la API Players

La API proporciona endpoints bajo el prefijo `/api/players` para gestionar jugadores dentro de la liga.

### 1. Obtener Todos los Jugadores
- **URL**: `/api/players?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera una lista de todos los jugadores. `seasonId` opcional.
- **Respuesta Exitosa**: `200 OK` (Devuelve un array de objetos de jugador)

### 2. Obtener Jugador por ID
- **URL**: `/api/players/:id?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera un jugador específico por su ID entero.
- **Respuesta Exitosa**: `200 OK` (Devuelve un único objeto de jugador)
- **Respuesta de Error**: `404 Not Found` (Si el ID del jugador no existe)

### 3. Obtener Jugadores por ID de Equipo
- **URL**: `/api/players/team/:teamId?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera todos los jugadores que pertenecen a un equipo específico en una temporada.
- **Respuesta Exitosa**: `200 OK` (Devuelve un array de objetos de jugador)

### 4. Crear un Jugador
- **URL**: `/api/players`
- **Method**: `POST`
- **Descripción**: Crea un nuevo jugador en la base de datos.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "TeamID": 1,
    "FirstName": "Michael",
    "LastName": "Jordan",
    "CategoryID": 2,
    "JerseyNumber": 23,
    "Position": "Escolta",
    "seasonId": 1
  }
  ```
- **Respuesta Exitosa**: `201 Created` (Devuelve el objeto de jugador recién creado)
- **Respuesta de Error**: `400 Bad Request` (Si faltan `TeamID`, `FirstName`, `LastName` o `CategoryID`), `401 Unauthorized`

### 5. Actualizar un Jugador
- **URL**: `/api/players/:id`
- **Method**: `PUT`
- **Descripción**: Actualiza la información de un jugador existente.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "Category": "Pro" 
  }
  ```
  *(Puede proporcionar cualquier combinación de `TeamID`, `FirstName`, `LastName` o `Category`).*
- **Respuesta Exitosa**: `200 OK` (Devuelve el objeto de jugador actualizado)
- **Respuesta de Error**: `400 Bad Request` (Si no se proporcionan campos para actualizar), `404 Not Found` (Si el ID del jugador no existe), `401 Unauthorized` (Si el token falta o es inválido)

### 6. Eliminar un Jugador
- **URL**: `/api/players/:id`
- **Method**: `DELETE`
- **Descripción**: Elimina un jugador de la base de datos por su ID.
- **Respuesta Exitosa**: `200 OK` (Devuelve `{"message": "Player deleted successfully."}`)
- **Respuesta de Error**: `404 Not Found` (Si el ID del jugador no existe), `401 Unauthorized` (Si el token falta o es inválido)

## Endpoints de la API Matches

La API proporciona endpoints bajo el prefijo `/api/matches` para gestionar la programación y los resultados de los partidos.

### 1. Obtener Todos los Partidos
- **URL**: `/api/matches?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera una lista de todos los partidos.
- **Respuesta Exitosa**: `200 OK` (Devuelve un array de objetos de partido)

### 2. Obtener Partido por ID
- **URL**: `/api/matches/:id?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera un partido específico por su ID entero.
- **Respuesta Exitosa**: `200 OK` (Devuelve un único objeto de partido)
- **Respuesta de Error**: `404 Not Found`

### 3. Programar un Partido
- **URL**: `/api/matches`
- **Method**: `POST`
- **Descripción**: Programa un nuevo partido entre dos equipos diferentes.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "LocalTeamID": 1,
    "VisitorTeamID": 2,
    "MatchDate": "2026-05-10",
    "MatchTime": "15:30:00",
    "Location": "Downtown Arena",
    "CategoryID": 3,
    "RoundNumber": 1,
    "seasonId": 1
  }
  ```
- **Respuesta Exitosa**: `201 Created` (Devuelve el objeto de partido recién creado)
- **Respuesta de Error**: `400 Bad Request` (Si faltan campos, o si hay conflicto de programación), `401 Unauthorized` (Si el token falta o es inválido)

### 4. Actualizar Detalles del Partido
- **URL**: `/api/matches/:id`
- **Method**: `PUT`
- **Descripción**: Actualiza los detalles de programación de un partido.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "Location": "Uptown Sports Center",
    "MatchTime": "16:00:00"
  }
  ```
  *(Puede proporcionar cualquier combinación de `MatchDate`, `MatchTime` o `Location`).*
- **Respuesta Exitosa**: `200 OK` (Devuelve el objeto de partido actualizado)
- **Respuesta de Error**: `400 Bad Request` (Si no se proporcionan campos de detalle), `404 Not Found` (Si el ID del partido no existe), `401 Unauthorized` (Si el token falta o es inválido)

### 5. Actualizar Puntaje del Partido
- **URL**: `/api/matches/:id/score`
- **Method**: `PUT`
- **Descripción**: Actualiza los resultados de un partido.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "LocalPoints": 88,
    "VisitorPoints": 76
  }
  ```
- **Respuesta Exitosa**: `200 OK` (Devuelve el objeto de partido actualizado)
- **Respuesta de Error**: `400 Bad Request` (Si faltan los puntos), `404 Not Found` (Si el ID del partido no existe), `401 Unauthorized` (Si el token falta o es inválido)

### 6. Eliminar un Partido
- **URL**: `/api/matches/:id`
- **Method**: `DELETE`
- **Descripción**: Elimina un partido de la base de datos por su ID.
- **Respuesta Exitosa**: `200 OK` (Devuelve `{"message": "Match deleted successfully."}`)
- **Respuesta de Error**: `404 Not Found` (Si el ID del partido no existe), `401 Unauthorized` (Si el token falta o es inválido)

## Endpoints de la API Standings

La API proporciona endpoints bajo el prefijo `/api/standings` para obtener la tabla de posiciones automatizada de la liga.

### 1. Obtener Tabla de Posiciones de la Liga
- **URL**: `/api/standings?seasonId={id}`
- **Method**: `GET`
- **Descripción**: Recupera la tabla de posiciones actual de la liga (se debe filtrar por `CategoryID` en el frontend).
- **Respuesta Exitosa**: `200 OK` (Devuelve un array de objetos de posiciones)
- **Respuesta de Error**: `500 Internal Server Error` (Si hay un problema con la base de datos)

## Endpoints de la API Auth

La API proporciona endpoints bajo el prefijo `/api/auth` para la autenticación de administradores.

### 1. Iniciar Sesión
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Descripción**: Autentica a un administrador y devuelve un token JWT.
- **Cuerpo de la Solicitud** (JSON):
  ```json
  {
    "Username": "admin",
    "Password": "your_password"
  }
  ```
- **Respuesta Exitosa**: `200 OK` (Devuelve `{"token": "eyJhbG..."}`)
- **Respuesta de Error**: `400 Bad Request` (Si faltan nombre de usuario o contraseña), `401 Unauthorized` (Si las credenciales son inválidas)
