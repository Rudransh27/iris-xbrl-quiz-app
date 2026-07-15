FROM node:22 AS build

WORKDIR /app

# 🔹 Limit Node memory inside container — 512MB was too tight for this
# app's actual Vite/Rollup production build (bundles xlsx, react-syntax-
# highlighter, socket.io-client, etc.) and crashed with a heap OOM. 2GB
# gives real headroom; if the Podman machine's own total RAM is under
# ~3GB, raise it in Podman Desktop's settings too.
ENV NODE_OPTIONS="--max_old_space_size=2048"

# 🔹 Limit Vite workers to reduce RAM usage
ENV VITE_CJS_WORKERS=1

# Baked into the build output by Vite — must be set before `npm run build`,
# not at container runtime. Passed in via docker-compose's build.args.
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

COPY package*.json ./
RUN npm ci

COPY . .

# 🔹 Build with limited threads
RUN npm run build

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]