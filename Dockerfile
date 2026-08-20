# 1. Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Production Runner
FROM node:20-alpine
WORKDIR /app

# Copy built frontend dist to /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/server.js"]
