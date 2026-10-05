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

# Build as the unprivileged `node` user, not root.
RUN chown node:node /app
USER node

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

# 🔹 Build with limited threads
RUN npm run build

# Unprivileged nginx: runs as the `nginx` user and listens on 8080
# (non-root processes can't bind ports below 1024).
FROM nginxinc/nginx-unprivileged:alpine

WORKDIR /usr/share/nginx/html

COPY --from=build --chown=nginx:nginx /app/dist ./
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]