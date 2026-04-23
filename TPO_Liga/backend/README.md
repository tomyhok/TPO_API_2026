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
│   └── teamController.js   # Handles business logic and database interactions for Teams
├── middlewares/            # Custom Express middlewares (e.g., error handlers, auth validation)
├── models/                 # Database models and data structures
├── routes/
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
