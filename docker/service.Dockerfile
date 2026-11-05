FROM node:20-bookworm-slim

ARG SERVICE_DIR
WORKDIR /app

COPY ${SERVICE_DIR}/package.json ${SERVICE_DIR}/package-lock.json ./
RUN npm ci --omit=dev
COPY microservices/shared /app/shared
COPY ${SERVICE_DIR}/ ./

CMD ["node", "app.js"]
