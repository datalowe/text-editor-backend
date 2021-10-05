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

COPY .env.local.docker /backend/.env
COPY app.ts /backend/
COPY routes /backend/routes/
COPY src /backend/src/
COPY mongo-entrypoint /backend/mongo-entrypoint/
COPY tsconfig.json /backend/tsconfig.json

EXPOSE 1337

CMD export $(cat /backend/.env | xargs) && set +o allexport && npm run build && npm run production