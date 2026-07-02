# TPO Liga - Frontend

Esta es la aplicación cliente (frontend) para la plataforma de gestión de la **Liga de Básquet Juvenil**. Está diseñada como una Single Page Application (SPA) reactiva que consume la API REST del backend para mostrar y administrar todas las estadísticas del torneo.

## Stack Tecnológico

- **React 18**: Librería principal para construir la interfaz de usuario.
- **Vite**: Bundler y servidor de desarrollo extremadamente rápido.
- **Tailwind CSS**: Framework de CSS utilitario para diseñar interfaces de manera rápida, moderna y responsiva.
- **Context API**: Utilizado para manejar el estado global de la aplicación (Temporada activa, Categorías, y el Panel Lateral).

## Características Principales

1. **Gestión Multitemporada y Categorías**:
   - Selector global de temporadas en la barra superior que actualiza instantáneamente los datos en toda la aplicación.
   - Pestañas de categorías integradas en todas las vistas (Partidos, Posiciones, Planteles) para segmentar la información por edad/división.
   - Listado de Temporadas en formato de lista panorámica, con información clave (Inicio, Fin, Estado). Al interactuar con una temporada, se despliega la tabla de posiciones específica de esa temporada en el panel lateral.
   - Gestor de temporadas exclusivo para administradores, que permite crear nuevas temporadas (copiando equipos y jugadores) y generar automáticamente el fixture (ida y vuelta) usando un algoritmo de Round Robin.

2. **Panel de Administración Seguro**:
   - Flujo de login con JWT.
   - Si el usuario es administrador, se habilitan automáticamente los botones y formularios (modales) para Crear, Editar y Eliminar (Equipos, Jugadores, Partidos, Temporadas).

3. **Dashboard e Informes**:
   - Vistas generales de la tabla de posiciones generadas dinámicamente.
   - Detalles interactivos de los equipos, mostrando su rendimiento, plantel actual, estadio y DT.
   - Panel lateral (`RightPanel`) interactivo que muestra vistas detalladas contextuales, como el `PlayerDetailsWidget` (con foto del jugador, logo del equipo y dorsal) o el `StandingsWidget`.
   - Componentes inteligentes de UI como `TeamLogo`, que detecta si una imagen web no carga (Error 404) y automáticamente presenta un ícono de escudo por defecto, manteniendo la estética de la app.
   - Vistas atractivas de los jugadores con soporte para carga de URLs de foto o placeholders por defecto.
   - Lista detallada de partidos, permitiendo la visualización rápida de resultados y alineaciones.

## Estructura del Proyecto

```text
src/
├── assets/          # Imágenes y recursos estáticos
├── components/      # Componentes principales (Vistas y Widgets)
│   ├── ui/          # Componentes reutilizables (Botones, Inputs, Modales, Cards, TeamLogo)
│   ├── widgets/     # Componentes de visualización detallada (TeamDetails, MatchDetails, PlayerDetailsWidget, StandingsWidget)
│   ├── Login.jsx
│   ├── MatchList.jsx
│   ├── PlayerList.jsx
│   ├── SeasonList.jsx
│   ├── Standings.jsx
│   └── TeamList.jsx
├── contexts/        # Estado global (Context API)
│   ├── CategoryContext.jsx
│   ├── RightPanelContext.jsx
│   └── SeasonContext.jsx
├── services/        # Lógica de conexión con el backend
│   └── api.js       # Cliente HTTP configurado para enviar JWT e interactuar con la API
├── App.jsx          # Enrutador principal y estructura base (Layout)
└── main.jsx         # Punto de entrada de la aplicación
```

## Configuración y Ejecución

### 1. Variables de Entorno

Puede crear un archivo `.env` en la carpeta `frontend` si necesita modificar la URL del backend (por defecto asume que el backend corre localmente o está proxyado).

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Esto iniciará Vite y proporcionará un servidor local con recarga rápida (HMR). Normalmente en `http://localhost:5173`.
