# Manual de Usuario - Liga de Básquet Juvenil

Bienvenido al manual de usuario de la plataforma de la Liga de Básquet Juvenil. Esta guía te ayudará a navegar por la interfaz pública y a utilizar el panel de administración si posees las credenciales correspondientes.

## 1. Navegación Pública

La plataforma está diseñada para que cualquier usuario pueda consultar el estado de la liga de manera sencilla.

- *Página Principal (Inicio):* Aquí podrás visualizar el listado de todos los partidos jugados y próximos a jugarse de la temporada seleccionada.
- *Selector de Temporada:* En la barra superior (o menú lateral), puedes cambiar la temporada actual para ver el historial de ligas pasadas.
- *Tabla de Posiciones:* En la sección "Posiciones", encontrarás la clasificación general dividida por categorías. Podrás ver los puntos, partidos jugados, ganados, empatados, perdidos y la diferencia de tantos.
- *Equipos y Jugadores:* Navega a las secciones de "Equipos" o "Jugadores" para ver el listado completo. Al hacer clic en un equipo, se abrirá un panel lateral con sus estadísticas, últimos resultados, próximos partidos y su plantel actual.

## 2. Acceso al Área Administrativa

Para poder gestionar (crear, editar o eliminar) información de la liga, debes iniciar sesión con una cuenta de administrador.

1. Ve a la sección *Login* en el menú de navegación.
2. Ingresa tus credenciales de administrador.
   - Nota: Si estás probando el proyecto, utiliza las credenciales de prueba provistas en la documentación técnica (README.md).
3. Tras un inicio de sesión exitoso, aparecerán nuevas opciones en el menú lateral como *Temporadas* y *Categorías*, y se habilitarán los botones de edición en toda la plataforma.

## 3. Gestión de la Liga (Sólo Administradores)

Una vez iniciada la sesión, tendrás control total sobre los datos:

### Gestión de Equipos
- Ve a la sección *Equipos*.
- Haz clic en *+ Nuevo Equipo* para dar de alta un equipo ingresando su nombre, entrenador, logo y estadio.
- Utiliza los botones *Editar* o *Eliminar* en la tarjeta de cada equipo para modificar su información o darlo de baja.

### Gestión de Jugadores
- Ve a la sección *Jugadores*.
- Selecciona *+ Nuevo Jugador*. Deberás indicar sus datos personales, la categoría y asignarle un equipo.
- Al igual que con los equipos, puedes editar su perfil o eliminarlo de la liga.

### Carga de Imágenes (Logos y Fotos)
- Para mantener la plataforma rápida y ligera, tanto el escudo (logo) de los equipos como la foto de perfil de los jugadores se cargan mediante *URL*.
- Cuando crees o edites un equipo/jugador, simplemente busca una imagen en internet (por ejemplo, en Google Imágenes), haz clic derecho sobre ella, selecciona "Copiar dirección de la imagen" y pega ese enlace en el campo correspondiente.

### Gestión de Partidos y Resultados
- En la sección *Inicio, verás un botón *+ Nuevo Partido**.
- Al crear un partido, define quién es el equipo local, el visitante, fecha, horario, lugar, ronda y la categoría correspondiente.
- Para *cargar resultados, haz clic en el botón de **Cargar Resultado* (o Editar) sobre un partido que ya se haya jugado e ingresa los puntos del equipo local y visitante. Al guardar, la tabla de posiciones se actualizará automáticamente gracias a la base de datos.

## 4. Configuración Técnica Inicial (Archivo .env)

Para que el sistema funcione correctamente en un entorno local y pueda conectarse a la base de datos, es fundamental crear un archivo de configuración de variables de entorno.

1. Navega a la carpeta /backend del proyecto.
2. Crea un archivo nuevo y nómbralo exactamente .env (sin extensión, empezando con un punto).
3. Abre el archivo con cualquier editor de texto y pega el siguiente contenido:

```env
PORT=3000
DB_SERVER=apisuade.database.windows.net
DB_PORT=1433
DB_NAME=LigaJuvenilUade
DB_USER=sqladmin
DB_PASSWORD=TpoApis2026!
JWT_SECRET=supersecret_youth_league_key
```


Una vez creado este archivo y guardados los cambios, podrás iniciar el servidor del backend de forma exitosa.