#
# ---- Base Node ----
FROM node:16-alpine AS base
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
RUN apk add --no-cache make gcc g++ python3 linux-headers udev git pkgconfig libusb-dev eudev-dev
# install node packages
RUN npm install -g npm
RUN npm set progress=false && npm config set depth 0
RUN npm ci

#
# ---- Test ----
# run linters, setup and tests
#FROM dependencies AS test
#RUN  npm run lint && npm run setup && npm run test
#RUN  npm run test

#
# ---- Release ----
# This will use the latest released version of lw.comm-server + associated LW app.
#  it DOES NOT build and serve the version of LaserWeb in this repo
#
FROM base AS release
WORKDIR /usr/src/app
# copy production node_modules
COPY --from=dependencies /usr/src/app/node_modules node_modules
# define CMD
CMD [ "npm", "run", "start-server" ]

#
# ---- Dev ----
FROM base AS dev
WORKDIR /usr/src/app
# copy production node_modules
COPY --from=dependencies /usr/src/app/node_modules node_modules
RUN npm install && npm install -g nodemon
RUN npm run bundle-dev
RUN rm -rfv node_modules/lw.comm-server/app/*
RUN cp -prv dist/* node_modules/lw.comm-server/app/
# define CMD
CMD [ "npm", "run", "start-server" ]
