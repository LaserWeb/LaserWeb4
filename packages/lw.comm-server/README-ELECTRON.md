# LaserWeb4-Installer

## Building package

### Prerquisites
#### Windows: ####
Install `windows-build-tools` from an Administrative Windows PowerShell : See https://github.com/felixrieseberg/windows-build-tools

#### Mac: ####
See https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#macos

#### Linux: ####
See https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#linux

### Prepare Temporary Build environment

1.  `mkdir mybuildenv` (or whatever you want to call it)
2.  `cd mybuildenv` (or whatever you want to call it)
3.  `git clone https://github.com/LaserWeb/lw.comm-server.git`
4.  `git clone https://github.com/LaserWeb/LaserWeb4.git`
5.  `cd LaserWeb4 && git fetch && git checkout dev-es6 && npm install  --verbose && npm run installdev`
6.  `cd .. && cd lw.comm-server && git fetch && git checkout electron_bundler && npm install --verbose`

### Prepare LW4 /dist
1.  `cd LaserWeb4`
2.  `npm run bundle-dev`

### Prepare Electron modules
1. `cd lw.comm-server`
2. `./node_modules/.bin/electron-rebuild`

### Build Electron App
1.   Run `npm run dist` to create installer

Optional:  You can also run `npm copy && ./node_modules/.bin/build` and append cross platform switches (--mac, --win, --linux to specify platforms. And --ia32, --x64 to specify arch. For example, to build app for MacOS, Windows and Linux: build -mwl) - see https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build for details


## Single Walk-away command
(Only after confirming each step on its own works)
```
mkdir mybuildenv &&\
cd mybuildenv &&\
git clone https://github.com/LaserWeb/lw.comm-server.git &&\
git clone https://github.com/LaserWeb/LaserWeb4.git &&\
cd LaserWeb4 &&\
git fetch && git checkout dev-es6 &&\
npm install --verbose &&\
npm run installdev &&\
cd .. && cd lw.comm-server &&\
git fetch && git checkout electron_bundler &&\
npm install --verbose &&\
cd .. && cd LaserWeb4 &&\
npm run bundle-dev &&\
cd .. && cd lw.comm-server &&\
./node_modules/.bin/electron-rebuild &&\
npm run dist
```

## Subsequent Updates

1.  `cd LaserWeb4 && git reset --hard && git pull && npm run installdev`
2.  `npm run bundle-dev`
3.  `cd ../lw.comm-server && git checkout electron_bundler && git reset --hard && git pull && npm install`
4. `./node_modules/.bin/electron-rebuild`
5.  `npm run dist`

## Quick update

```
#!bin/bash
cd LaserWeb4 && git reset --hard && git pull && npm run installdev && npm run bundle-dev && cd ..
cd lw.comm-server && git checkout electron_bundler && git reset --hard && git pull && npm install && ./node_modules/.bin/electron-rebuild
#if you need
#npm run dist

```
