# TextEditor: Express Backend
[![Build Status](https://app.travis-ci.com/datalowe/text-editor-backend.svg?branch=main)](https://app.travis-ci.com/datalowe/text-editor-backend)

This is an [Express](https://expressjs.com) project which is to serve API requests from a text editor app, like [this one](https://github.com/datalowe/text-editor-angular). Express in turn relies on a [MongoDB](https://www.mongodb.com/) database for data storage.

The project is put together for a JavaScript framework course at Blekinge Institute of Technology.

## Setup and installation directly on host computer
### Development mode
First, make a copy of the hidden file '.env.example' and name it '.env'. Open it and enter your database credentials/URI specifications and what port the Express app should be running on. 

`cd` into this directory and run `npm install` to install all required dependencies. Then run `npm start` to start a development server.

### Production mode
When running the app in production, it is assumed that environment variables (the ones listed in '.env.example') have already been defined. Use appropriate methods for your deployment service/environment to define them.

`cd` into this directory and run `npm install` to install all required dependencies. Then run `npm run production` to start a production server.

## Deployment using Docker
### With local mongodb container 
Install [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/).

`cd` into this directory and run `docker compose up`. This will first spin up a `mongodb` container. Once that's done, a container for this app is spun up. The app's image is based on the root directory Dockerfile.

The `mongodb` container is made accessible to the host environment - remove mongodb port binding in 'docker-compose.yaml' if this isn't something you want.

Note that by default, no container/database data are persisted to outside of the container, meaning all database entries will be lost when killing the container. If you want data to be persisted to outside of the container, you can uncomment data storage/volume-related lines in 'docker-compose.yaml'. 

Also note that if you change any of the environment variables in '.env.local.docker' you will also need to update environment variables defined 'docker-compose.yaml', and vice versa.

### With other mongodb database using Docker
If you want to run the app as a Docker container, but don't want the database to also be handled by Docker: 
1. Create an '.env' file as described in 'Setup and installation directly on host computer'. 
2. Open up the Dockerfile and change the line `COPY .env.local.docker /backend/.env` to `COPY .env /backend/env_config.json`.
3. Comment out lines related to the mongodb-container in 'docker-compose.yaml', including the `depends_on` lines for the 'web' service/container.
3. `cd` to the root directory and run `docker compose build` (or `docker-compose build`, depending on your environment).
4. Run `docker compose up`.

## API routes
### Authentication-related endpoints
* `example.com:port/user/login`: POST. Requires request to include a JSON-formatted body which has keys 'username' and 'password'. Returns a JSON-formatted body with a single object with key 'token' which has a generated JWT which is valid for 1h.
* `example.com:port/user/register`: POST. Requires request to include a JSON-formatted body which has keys 'username' and 'password'. Creates user in backend service.
* `example.com:port/user/list`: GET. Requires request to include an 'x-access-token' header with a valid user JWT. Returns a JSON-formatted body with an array holding all registered users' usernames.

### Document-related endpoints
All these endpoints require that the user is already authenticated, ie an 'x-access-token' header is included in the request and holds a valid JWT.
* `example.com:port/editor-api/document`: GET. Returns a JSON-formatted body with an array holding all text documents in the database, including 'id', 'title' and 'body' fields for each one.
* `example.com:port/editor-api/document/<document_id>`: GET. Returns a JSON-formatted body with a single object representing a matching text document in the database, including 'id', 'title' and 'body' fields.
* `example.com:port/editor-api/document`: POST. Requires request to include a JSON-formatted body which has keys 'title' and 'body'. Returns a JSON-formatted body with a single object representing the created text document in the database, including 'id', 'title' and 'body' fields.
* `example.com:port/editor-api/document/<document_id>`: PUT. Requires request to include a JSON-formatted body which has keys 'title' and 'body'. Returns a JSON-formatted body with a single object representing the updated text document in the database, including 'id', 'title' and 'body' fields.

## socket.io events
See 'app.ts' for code related to how the `socket.io` package is used to accept and broadcast events related to document body updates.
