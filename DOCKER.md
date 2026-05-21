# LaserWeb (4.1.x) Docker Builds

This guide assumes some familiarity with [Docker](https://www.docker.com/), if you are new to Docker please start at: https://docs.docker.com/get-started/

Docker user targets:
- release
- dev

## Dev (development snapshot)
You can run the current developement version of the app in Docker using the commands below.
- build development image:
```
docker build --target dev -t laserweb4:dev .
```
- run image:
```
docker run -it --device=/dev/ttyUSB0 --rm -p 8000:8000 laserweb4:dev
```
- connect to app: http://localhost:8000

## Release
You can run the current lw.comm-server version of the app in Docker using the commands below.

**Warning:** This will bundle the current (head) [lw.comm-server head](https://github.com/LaserWeb/lw.comm-server/) Git version + the LW app bundled with that, it *does not* build the latest LW app from this repo! Use the 'dev' target for that.

- build release image:
```
docker build --target release -t laserweb4:release .
```
- run image:
```
docker run -it --device=/dev/ttyUSB0 --rm -p 8000:8000 laserweb4:release
```
- connect to app: http://localhost:8000

## Options
- Change the `--device=` to point to the correct USB device if necesscary, eg `--device=/dev/ttyACM0` etc.
- To use a different port change the port mapping in the `docker run` command to `<port number>:8000` and adjust the url you connect to appropriately.

## Stopping
Stopping the running container can be tricky, it wont respond to conventional stop commands (ctrl-c, etc.)
Start a new shell and stop the attached container with `docker stop <uuid>`
To list running docker containers use: `docker ps`

## Run in background
If you add `-d` to the docker run command it will start the container in detached mode.
You can use `docker logs -f <uuid>` to follow the output of this.

## Clean build
If you plan to release the docker build it is suggested you clean the dist folder first to avoid bundling obsolete build artifacts:
`rm dist/* && git checkout dist`

## Allow hot plugging & selection of connected devices
**This is NOT recommended, since it involves running the container in `--privileged` mode, which is a [potential security risk](https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities).**

_..you have been warned.._

- run image:
```
docker run -it -v /dev:/dev --rm -p 8000:8000 --cap-add=sys_nice --privileged laserweb4:dev (or relese)
```
- when you connect the app you should be able to see all USB devices in the selection list
