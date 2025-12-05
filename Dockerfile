FROM node:22 AS build

WORKDIR /app

# 🔹 Limit Node memory inside container
ENV NODE_OPTIONS="--max_old_space_size=512"

# 🔹 Limit Vite workers to reduce RAM usage
ENV VITE_CJS_WORKERS=1

COPY package*.json ./
RUN npm ci

COPY . .

# 🔹 Build with limited threads
RUN npm run build -- --maxWorkers=1

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
