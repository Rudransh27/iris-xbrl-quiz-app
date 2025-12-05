# FROM node:22 AS build

# WORKDIR /app

# # 🔹 Limit Node memory inside container
# ENV NODE_OPTIONS="--max_old_space_size=512"

# # 🔹 Limit Vite workers to reduce RAM usage
# ENV VITE_CJS_WORKERS=1

# COPY package*.json ./
# RUN npm ci

# COPY . .

# # 🔹 Build with limited threads
# RUN npm run build

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]