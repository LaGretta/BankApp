# ---- Build stage: Vite build ----
FROM node:22 AS build
WORKDIR /app

# Install deps first (cache-friendly: lockfile only)
COPY package*.json ./
RUN npm ci

# Build the PWA (tsc + vite → dist/)
COPY . .
RUN npm run build

# ---- Runtime stage: nginx serves the static dist ----
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
