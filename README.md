# TextEditor: Express Backend
This is an [Express](https://expressjs.com) project which is to serve API requests from a text editor app, like [this one](https://github.com/datalowe/text-editor-angular). Express in turn relies on a [MongoDB](https://www.mongodb.com/) database for data storage.

The project is put together for a JavaScript framework course at Blekinge Institute of Technology.

## Setup and installation directly on host computer
First, make a copy of 'env_config.json.example' and name it 'env_config.json'. Open it and enter your database credentials/URI specifications and what port the Express app should be running on. 

`cd` into this directory and run `npm install` to install all required dependencies. Then run `npm start` to start a development server. If you instead want to run a production server, run `npm run production`.

## Deployment with local mongodb container using Docker
Install [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/).

`cd` into this directory and run `docker compose`. This will first spin up a `mongodb` container. Once that's done, a container for this app is spun up. The app's image is based on the root directory Dockerfile.

The `mongodb` container is made accessible to the host environment - remove mongodb port binding in 'docker-compose.yaml' if this isn't something you want.

Note that by default, no container/database data are persisted to outside of the container, meaning all database entries will be lost when killing the container. If you want data to be persisted to outside of the container, you can uncomment data storage/volume-related lines in 'docker-compose.yaml'. 

Also note that if you change any of the database configuration variables (in 'env_config_local_docker.json' or 'docker-compose.yaml'), you will likely need to also update the 'mongo-entrypoint/entrypoint.js' script. This is an inconvenience that [could be solved](https://stackoverflow.com/questions/64606674/how-can-i-pass-environment-variables-to-mongo-docker-entrypoint-initdb-d) by using only environment variables and a .sh script rather than a .js script, if you want to spend time on that.

## Deployment with other mongodb database using Docker
If you want to run the app as a Docker container, but don't want the database to also be handled by Docker: 
1. Create an 'env_config.json' file as described in 'Setup and installation directly on host computer'. 
2. Open up the Dockerfile and change the line `COPY env_config_local_docker.json /backend/env_config.json` to `COPY env_config.json /backend/env_config.json`.
3. Update 'docker-compose.yaml' as necessary, eg changing the port binding if you modified the `expressPort` variable's value in the Dockerfile.
3. `cd` to the the directory and run `docker compose build .` (or `docker-compose build`, depending on your environment).
4. Run `docker compose .`.

## API routes
* `example.com:port/editor-api/document`: GET. Returns a JSON-formatted body with an array holding all text documents in the database, including '_id', 'title' and 'body' fields for each one.
* `example.com:port/editor-api/document/<document_id>`: GET. Returns a JSON-formatted body with a single object representing a matching text document in the database, including '_id', 'title' and 'body' fields.
* `example.com:port/editor-api/document/create`: POST. Requires request to include a JSON-formatted body which has keys 'title' and 'body'.
* `example.com:port/editor-api/document/update`: UPDATE. Requires request to include a JSON-formatted body which has keys '_id', 'title' and 'body'.
