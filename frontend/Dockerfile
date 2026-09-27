# frontend/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json astro.config.mjs ./
RUN npm ci

COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# ==========================================
# Production Stage serving static HTML assets through Nginx Web Server proxy
FROM nginx:alpine

# 🆕 FIXED: Copy your custom reverse proxy configuration directly into Nginx configurations mappings
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
