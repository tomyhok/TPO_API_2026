# Youth Basketball League API

This is the backend API for the Youth Basketball League platform, built to manage teams, matches, and league statistics. This service provides the core endpoints necessary to create, retrieve, update, and delete team information and connects to a SQL Server database.

## Tech Stack

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
- **SQL Server**: Relational database management system.
- **mssql**: Microsoft SQL Server client for Node.js.
- **dotenv**: Module to load environment variables from a `.env` file.
- **cors**: Middleware for enabling Cross-Origin Resource Sharing.

## Project Structure

Our `src` folder is organized as follows:

```text
src/
├── config/
│   └── db.js               # SQL Server database connection setup using mssql
├── controllers/
│   ├── matchController.js  # Handles business logic and database interactions for Matches
│   ├── playerController.js # Handles business logic and database interactions for Players
│   ├── standingsController.js # Handles logic for fetching league standings
│   └── teamController.js   # Handles business logic and database interactions for Teams
├── middlewares/            # Custom Express middlewares (e.g., error handlers, auth validation)
├── models/                 # Database models and data structures
├── routes/
│   ├── matchRoutes.js      # Express router definitions for Match endpoints
│   ├── playerRoutes.js     # Express router definitions for Player endpoints
│   ├── standingsRoutes.js  # Express router definitions for Standings endpoints
│   └── teamRoutes.js       # Express router definitions for Team endpoints
├── app.js                  # Express application setup, applying middlewares and routes
└── server.js               # Entry point of the application, starts the HTTP server
```

## Setup & Execution

Follow these step-by-step instructions to set up the environment and run the server locally.

### 1. Configure the Environment Variables

Create a file named `.env` in the root of the `backend` directory (if it doesn't already exist) and configure your database settings. Your `.env` file should look like this:

```env
PORT=3000
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=YouthBasketballLeague

JWT_SECRET=supersecret_youth_league_key
```
> **Note**: Adjust the `DB_SERVER`, `DB_PORT`, and `DB_NAME` values to match your local SQL Server instance.

### 2. Install Dependencies

Ensure you have Node.js installed, then install the required dependencies:

```bash
npm install
```

### 3. Run the Server

To start the server in development mode using `nodemon` (which will automatically restart the server upon file changes):

```bash
npm run dev
```

You should see output indicating that the server is running on port 3000 and has successfully connected to the database.

## Teams API Endpoints

The API provides endpoints under the `/api/teams` prefix to manage basketball teams.

### 1. Get All Teams
- **URL**: `/api/teams`
- **Method**: `GET`
- **Description**: Retrieves a list of all teams in the league.
- **Success Response**: `200 OK` (Returns an array of team objects)

### 2. Get Team by ID
- **URL**: `/api/teams/:id`
- **Method**: `GET`
- **Description**: Retrieves a specific team by its integer ID.
- **Success Response**: `200 OK` (Returns a single team object)
- **Error Response**: `404 Not Found` (If the team ID does not exist)

### 3. Create a Team
- **URL**: `/api/teams`
- **Method**: `POST`
- **Description**: Creates a new team in the database.
- **Request Body** (JSON):
  ```json
  {
    "Name": "Golden Eagles",
    "Coach": "John Doe"
  }
  ```
- **Success Response**: `201 Created` (Returns the newly created team object)
- **Error Response**: `400 Bad Request` (If `Name` or `Coach` are missing)

### 4. Update a Team
- **URL**: `/api/teams/:id`
- **Method**: `PUT`
- **Description**: Updates an existing team's Name or Coach.
- **Request Body** (JSON):
  ```json
  {
    "Name": "Silver Hawks" 
  }
  ```
  *(You can provide either `Name`, `Coach`, or both).*
- **Success Response**: `200 OK` (Returns the updated team object)
- **Error Response**: `400 Bad Request` (If no fields are provided to update), `404 Not Found` (If the team ID does not exist)

### 5. Delete a Team
- **URL**: `/api/teams/:id`
- **Method**: `DELETE`
- **Description**: Deletes a team from the database by its ID.
- **Success Response**: `200 OK` (Returns `{"message": "Team deleted successfully."}`)
- **Error Response**: `404 Not Found` (If the team ID does not exist)

## Players API Endpoints

The API provides endpoints under the `/api/players` prefix to manage players within the league.

### 1. Get All Players
- **URL**: `/api/players`
- **Method**: `GET`
- **Description**: Retrieves a list of all players.
- **Success Response**: `200 OK` (Returns an array of player objects)

### 2. Get Player by ID
- **URL**: `/api/players/:id`
- **Method**: `GET`
- **Description**: Retrieves a specific player by their integer ID.
- **Success Response**: `200 OK` (Returns a single player object)
- **Error Response**: `404 Not Found` (If the player ID does not exist)

### 3. Get Players by Team ID
- **URL**: `/api/players/team/:teamId`
- **Method**: `GET`
- **Description**: Retrieves all players belonging to a specific team.
- **Success Response**: `200 OK` (Returns an array of player objects)

### 4. Create a Player
- **URL**: `/api/players`
- **Method**: `POST`
- **Description**: Creates a new player in the database.
- **Request Body** (JSON):
  ```json
  {
    "TeamID": 1,
    "FirstName": "Michael",
    "LastName": "Jordan",
    "Category": "Senior"
  }
  ```
- **Success Response**: `201 Created` (Returns the newly created player object)
- **Error Response**: `400 Bad Request` (If `TeamID`, `FirstName`, `LastName`, or `Category` are missing)

### 5. Update a Player
- **URL**: `/api/players/:id`
- **Method**: `PUT`
- **Description**: Updates an existing player's information.
- **Request Body** (JSON):
  ```json
  {
    "Category": "Pro" 
  }
  ```
  *(You can provide any combination of `TeamID`, `FirstName`, `LastName`, or `Category`).*
- **Success Response**: `200 OK` (Returns the updated player object)
- **Error Response**: `400 Bad Request` (If no fields are provided to update), `404 Not Found` (If the player ID does not exist)

### 6. Delete a Player
- **URL**: `/api/players/:id`
- **Method**: `DELETE`
- **Description**: Deletes a player from the database by their ID.
- **Success Response**: `200 OK` (Returns `{"message": "Player deleted successfully."}`)
- **Error Response**: `404 Not Found` (If the player ID does not exist)

## Matches API Endpoints

The API provides endpoints under the `/api/matches` prefix to manage match scheduling and results.

### 1. Get All Matches
- **URL**: `/api/matches`
- **Method**: `GET`
- **Description**: Retrieves a list of all matches.
- **Success Response**: `200 OK` (Returns an array of match objects)

### 2. Get Match by ID
- **URL**: `/api/matches/:id`
- **Method**: `GET`
- **Description**: Retrieves a specific match by its integer ID.
- **Success Response**: `200 OK` (Returns a single match object)
- **Error Response**: `404 Not Found` (If the match ID does not exist)

### 3. Schedule a Match
- **URL**: `/api/matches`
- **Method**: `POST`
- **Description**: Schedules a new match between two different teams.
- **Request Body** (JSON):
  ```json
  {
    "LocalTeamID": 1,
    "VisitorTeamID": 2,
    "MatchDate": "2026-05-10",
    "MatchTime": "15:30:00",
    "Location": "Downtown Arena"
  }
  ```
- **Success Response**: `201 Created` (Returns the newly created match object)
- **Error Response**: `400 Bad Request` (If fields are missing, or if `LocalTeamID` and `VisitorTeamID` are the same)

### 4. Update Match Details
- **URL**: `/api/matches/:id`
- **Method**: `PUT`
- **Description**: Updates the scheduling details of a match.
- **Request Body** (JSON):
  ```json
  {
    "Location": "Uptown Sports Center",
    "MatchTime": "16:00:00"
  }
  ```
  *(You can provide any combination of `MatchDate`, `MatchTime`, or `Location`).*
- **Success Response**: `200 OK` (Returns the updated match object)
- **Error Response**: `400 Bad Request` (If no detail fields are provided), `404 Not Found` (If the match ID does not exist)

### 5. Update Match Score
- **URL**: `/api/matches/:id/score`
- **Method**: `PUT`
- **Description**: Updates the results of a match.
- **Request Body** (JSON):
  ```json
  {
    "LocalPoints": 88,
    "VisitorPoints": 76
  }
  ```
- **Success Response**: `200 OK` (Returns the updated match object)
- **Error Response**: `400 Bad Request` (If points are missing), `404 Not Found` (If the match ID does not exist)

### 6. Delete a Match
- **URL**: `/api/matches/:id`
- **Method**: `DELETE`
- **Description**: Deletes a match from the database by its ID.
- **Success Response**: `200 OK` (Returns `{"message": "Match deleted successfully."}`)
- **Error Response**: `404 Not Found` (If the match ID does not exist)

## Standings API Endpoints

The API provides endpoints under the `/api/standings` prefix to fetch the automated league standings.

### 1. Get League Standings
- **URL**: `/api/standings`
- **Method**: `GET`
- **Description**: Retrieves the current league standings, ordered by total points in descending order.
- **Success Response**: `200 OK` (Returns an array of standing objects)
- **Error Response**: `500 Internal Server Error` (If there is a database issue)
