FROM node:20-bookworm-slim

WORKDIR /app

COPY frontend-1/package.json frontend-1/package-lock.json ./
RUN npm ci
COPY frontend-1/ ./

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
