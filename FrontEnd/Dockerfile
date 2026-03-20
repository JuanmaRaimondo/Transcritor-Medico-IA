# Etapa de construcción (Build stage)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuración del proyecto
COPY package.json package-lock.json ./

# Instalar las dependencias
RUN npm ci

# Copiar el resto del código y construir la versión de producción
COPY . .
RUN npm run build

# Etapa de producción con Nginx (Serve stage)
FROM nginx:alpine

# Copiar la carpeta 'dist' generada en la etapa de construcción anterior a la ruta por defecto de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configurar archivo temporal de Nginx para soportar rutas dinámicas en SPA (React Router)
RUN echo -e 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 (por defecto de nginx)
EXPOSE 80

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
