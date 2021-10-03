FROM debian:buster-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    curl \
    && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g npm && npm install -g n && n stable

COPY package.json /backend/

WORKDIR /backend/

RUN npm install --save

COPY env_config_local_docker.json /backend/env_config.json
COPY app.ts /backend/
COPY routes /backend/routes/
COPY src /backend/src/
COPY mongo-entrypoint /backend/mongo-entrypoint/

EXPOSE 1337

CMD npm run production