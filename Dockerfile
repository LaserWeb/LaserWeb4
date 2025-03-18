#
# ---- Base Node ----
FROM node:10-alpine AS base

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos do projeto
COPY package*.json ./
EXPOSE 8000
COPY . .

#
# ---- Dependencies ----
FROM base AS dependencies

# Instalar dependências do sistema
RUN apk add --no-cache make gcc g++ python python3 linux-headers udev git

# Forçar HTTPS no Git
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"

# Forçar HTTPS no npm (evita erro ao baixar dependências)
RUN npm config set strict-ssl false
RUN npm config set progress=false && npm config set depth 0

# Instalar pacotes npm sem erros de permissão
RUN npm ci --unsafe-perm

#
# ---- Test ----
FROM dependencies AS test
RUN npm run test

#
# ---- Dev ----
FROM dependencies AS dev

# Instalar Nodemon globalmente
RUN npm install && npm install -g nodemon

# Copiar módulos do ambiente de dependências
COPY --from=dependencies /usr/src/app/node_modules node_modules

# Definir comando padrão
CMD [ "npm", "run", "start-server" ]

