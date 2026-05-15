# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --legacy-peer-deps

COPY backend/package*.json ./backend/
RUN apk add --no-cache python3 make g++ && cd backend && npm install

COPY . .

RUN cd frontend && npm run build
RUN cd backend && npm run build
RUN mkdir -p backend/dist/public && cp -r frontend/dist/* backend/dist/public/
RUN cd backend && npm prune --omit=dev

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app

COPY backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules

COPY --from=builder /app/backend/dist ./backend/dist
# Next step - make the app read these from the host
# COPY config.json ./
# COPY data/ ./data/
# COPY themes/ ./themes/

ENV NODE_ENV=production
ENV PORT=3001
ENV LOGS_DIR=/app/logs
EXPOSE 3001

RUN mkdir -p /app/logs

CMD ["node", "backend/dist/index.js"]
