# Server Monitoring API

## Project setup

1. Install dependencies:
    ```
    npm install
    ```
2. Create a PostgreSQL database
3. Create a `.env` file and store the database parameters in it. See [environment variables](#environment-variables).
4. Initialize the database:
    ```
    knex migrate:latest
    ```
5. And finally, start the server with:
    ```
    npm run start
    ```
   Or, to compile with hot-reloads for development:
    ```
    npm run start:watch
    ```

## Environment variables

You will need to create a `.env` file in your project root. This file is used to customize various parts of the server, and at the very least it provides a session secret and the parameters necessary to connect to your database. Here is sample file:

```
DEVELOPMENT=false
REDIS_PASSWORD=change_this
SESSION_SECRET=change_this

BASE_PATH=/api
PORT=3000
HIDE_IP=false

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=scottmangiapane
POSTGRES_PASSWORD=
POSTGRES_DATABASE=status
```