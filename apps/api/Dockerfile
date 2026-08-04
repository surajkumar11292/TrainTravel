FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY apps/api ./apps/api

EXPOSE 4000

CMD ["npm", "run", "dev:api"]
