#
# ---- Base Node ----
FROM node:10-alpine AS base
# set working directory
WORKDIR /usr/src/app

# copy project file
COPY package*.json ./
EXPOSE 8000
# copy app sources
COPY . .

#
# ---- Dependencies ----
FROM base AS dependencies
RUN apk add --no-cache make gcc g++ python python3 linux-headers udev git
RUN git config --global url."https://github.com".insteadOf "ssh://git@github.com"
# install node packages
RUN npm set progress=false && npm config set depth 0
RUN npm ci

#
# ---- Test ----
# run linters, setup and tests
FROM dependencies AS test
#RUN  npm run lint && npm run setup && npm run test
RUN  npm run test

#
# ---- Dev ----
FROM dependencies AS dev
RUN npm install && npm install -g nodemon
# copy production node_modules
COPY --from=dependencies /usr/src/app/node_modules node_modules
# define CMD
CMD [ "npm", "run", "start-server" ]
