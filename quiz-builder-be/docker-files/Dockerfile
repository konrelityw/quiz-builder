ARG NODE_VERSION=24.7.0-slim

FROM node:${NODE_VERSION} AS backend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:${NODE_VERSION} AS backend-runner

WORKDIR /app
COPY --from=backend-builder * /app

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["node", "main.js"]
