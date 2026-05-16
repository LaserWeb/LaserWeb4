#
# ---- Base Node ----
FROM node:16-bullseye AS base
# set working directory
WORKDIR /usr/src/app
# Set up Apt, install build tooling and udev
RUN apt update
RUN apt install -y build-essential udev
# Upgrade npm and set node options
RUN npm install -g npm
RUN npm set progress=false
# Set the port the container serves on
EXPOSE 8000

#
# ---- comm-server ----
FROM base AS comm-server
# Run npm install and add nodemon + lw comm server from Git
#  (Currently use --force to allow for broken deps, this should be removed once the dep tree is fixed
RUN npm install -g nodemon && npm install --force lw.comm-server@git+https://github.com/LaserWeb/lw.comm-server.git

# ---- Release ----
# This will use the git head version of lw.comm-server + the LW app version bundled with that.
#  it DOES NOT build and serve the version of LaserWeb in this repo
#
FROM comm-server AS release
WORKDIR /usr/src/app
# define CMD
CMD [ "node", "node_modules/lw.comm-server/server.js"]

#
# ---- Dependencies ----
FROM base AS dependencies
# install node packages
# Run npm install and add nodemon + lw comm server from Git
#  (Currently use --force to allow for broken deps, this should be removed once the dep tree is fixed
# copy app sources
COPY . .
RUN npm -force install && npm install --force lw.comm-server@git+https://github.com/LaserWeb/lw.comm-server.git

#
# ---- Bash (helpful for debug) ----
FROM dependencies AS bash
WORKDIR /usr/src/app
# define CMD
CMD [ "bash" ]

#
# ---- Dev ----
FROM dependencies AS dev
WORKDIR /usr/src/app
# Bundle the development build
RUN npm run bundle-dev
# Install into lw-comm-server
RUN rm -rfv node_modules/lw.comm-server/app/* && cp -prv dist/* node_modules/lw.comm-server/app/
# define CMD
CMD [ "node", "node_modules/lw.comm-server/server.js"]
