# syntax=docker/dockerfile:1

# Usa una imagen ligera de Node.js basada en Alpine localmente soportada en la documentacion
ARG NODE_VERSION=20.12.0
FROM node:${NODE_VERSION}-alpine

# Usa un entorno de producción (o desarrollo si lo prefieres para desarrollo y usar nodemon)
# ENV NODE_ENV production

# Define el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Ejecutar como usuario no root (el usuario "node" viene incluido por la imagen alpina)
RUN chown -R node:node /usr/src/app
USER node

# Copia los archivos del gestor de dependencias e instálalas con caché de capas de docker
COPY --chown=node:node package*.json ./
RUN npm install

# Copia el código fuente restante de la aplicación al directorio del contenedor
COPY --chown=node:node . .

# Expone el puerto por donde Express va a escuchar peticiones
EXPOSE 3000

# Define el comando por defecto al iniciar el contenedor
CMD ["npm", "run", "dev"]
