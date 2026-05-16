# LaserWeb4 Frontend Developers HowTo & Guide
This guide is aimed at anybody wishing to contribute to LaserWeb4 frontend development. It shows how to setup a development machine, and how to build the Fontend using webpack (+ webpack devserver).

The Frontend is highly integrated with the backend `lw.comm-server`, which serves the Frontend via HTTP and has firmware-aware routines for many control actions (jogging, etc).
* The frontend itself is delivered as a self-contained java webapp in a folder that is deployed into the comm-server, or run standalone. 
* Building and deploying `lw.comm-server` is not covered here. (TODO: Link to relevant docs for this)

## Machine Prep
This is still a WIP!

For support please go to the MakerForums at: https://forum.makerforums.info/c/laserweb-cncweb/

### Supported systems
The basic requirement is Node >= 12, and npm >= 7.

However; the 'real' requirement is node 16; several of the modules we use sitll work with Node12, but no longer formally support it and can be expected to fail sometime in the future.

I use Fedora 35, node 16 and npm 8 on a fast laptop as my primary development environment, but I test and deploy my previews on a Pi 4 running Bullseye.

These Instructions should work for all Pi 3 and 4 models running the Buster and Bullseye releases. Also see the [wiki](https://github.com/LaserWeb/lw.comm-server/wiki/Manual-Installation-(RasPi)) page about Pi installation for more info and notes on how to run LaserWeb4 as a service.

## Raspbian/Debian Bullseye
This is nice and easy; node 12 is part of the RPI OS release.

    pi@lwserver:~ $ uname -a
    Linux lwserver.easytarget.org 5.10.63-v8+ #1488 SMP PREEMPT Thu Nov 18 16:16:16 GMT 2021 aarch64 GNU/Linux

    pi@lwserver:~ $ lsb_release -a
    No LSB modules are available.
    Distributor ID: Raspbian
    Description:    Raspbian GNU/Linux 11 (bullseye)
    Release:        11
    Codename:       bullseye

    pi@lwserver:~ $ sudo apt update
    ...
    All packages are up to date.

### Install build tools, NodeJS and NPM on Bullseye
*Note: if you have previously followed instructions given here showing you how to install Node10 and hold to that version, you should unpin node with `sudo apt-mark unhold nodejs` and then remove the node repos with `sudo rm /etc/apt/sources.list.d/nodesource.list`*

    pi@lwserver:~ $ sudo apt install build-essential nodejs npm
    ... lots of output, on my test system 180'ish small packages are installed.. should result in success

    pi@lwserver:~ $ node -v
    v12.22.5

    pi@lwserver:~ $ npm -v
    7.5.2

## Raspbian/Debian running Buster
Unfortunately, Node 12 is not part of the RPI OS release (Node 10 is the standard, but we are not compatible with that) and so we need to use node 12 from nodesource.org

    pi@buster:~ $ uname -a
    Linux buster.easytarget.org 5.10.63-v7+ #1496 SMP Wed Dec 1 15:58:11 GMT 2021 armv7l GNU/Linux

    pi@buster:~ $ lsb_release -a
    No LSB modules are available.
    Distributor ID: Raspbian
    Description:    Raspbian GNU/Linux 10 (buster)
    Release:        10
    Codename:       buster

    pi@buster:~ $ sudo apt update
    ...
    All packages are up to date.

### Install build tools, NodeJS and NPM on Buster
We will ensure some required tools are in place, then run the setup script from nodesource.com, once that is done we can install nodejs and npm using apt in the same manner as for bullseye

    pi@buster:~ $ sudo apt install curl dirmngr apt-transport-https lsb-release ca-certificates
    ... it's quite liklely that these are already installed

    pi@buster:~ $ curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
    ... the script will run, and configure apt to use the node12 repositories

    pi@buster:~ $ sudo apt install build-essential nodejs
    ... should only install a few packages and result in success

    pi@buster:~ $ node -v
    v12.22.8

    pi@buster:~ $ npm -v
    6.14.15

# Download the repos from GitHub
These repos are somewhat large, the clone operations may be slow

    pi@lwserver:~ $ git clone https://github.com/LaserWeb/LaserWeb4.git
    OR, if you have a GitHub account: git clone git@github.com:LaserWeb/LaserWeb4.git
    Cloning into 'LaserWeb4'...

    pi@lwserver:~ $ ls LaserWeb4/
    dist        docs  jsdoc.json      LICENSE.md   package.json       README.md  webpack.config.js
    Dockerfile  git   laserweb@0.4.0  logfile.txt  package-lock.json  src        win.shell.cmd

    pi@lwserver:~ $ cd LaserWeb4/
    pi@lwserver:~/LaserWeb4 $ git branch
    * dev-es6

    Now we must initilise and update the LW4 submodules
    pi@lwserver:~/LaserWeb4 $ git submodule init
    Submodule 'src/data/lw.machines' (https://github.com/LaserWeb/lw.machines) registered for path 'src/data/lw.machines'
    Submodule 'src/data/lw.materials' (https://github.com/LaserWeb/lw.materials.git) registered for path 'src/data/lw.materials'

    pi@lwserver:~/LaserWeb4 $ git submodule update
    Cloning into '/home/pi/LaserWeb/LaserWeb4/src/data/lw.machines'...
    Cloning into '/home/pi/LaserWeb/LaserWeb4/src/data/lw.materials'...
    Submodule path 'src/data/lw.machines': checked out '685d9de193400a7bcf35d921eda21e4bedfbdc7b'
    Submodule path 'src/data/lw.materials': checked out 'dce9f9ae104030e192a9716f095988dc33c0c0cd'

## Build LaserWeb4 frontend
First we install laserweb4's dependencies

    pi@lwserver:~ $ cd ~/LaserWeb4/

    pi@lwserver:~/LaserWeb4 $ npm install

If you have failures here the first thing to do is 'reset' the package lock with `rm package-list.json` and trying again.

## Build and Generate a distribution (aka Bundle) the frontend build
The results end up in the `dist` folder of the repo

    pi@lwserver:~/LaserWeb4 $ npm run bundle-dev

The results of the build will go into the `./dist` folder in the repo.
* You can serve them directly from there with `python3 -m http.server 8000` and connect to port 8000 in your browser
* You can 'clean' the `dist` folder with `cd dist && rm * && git checkout .` (TODO: npm run clean-dist)

## CI
WebPack allows handy ways of continuously integrating/building your local code.

    pi@lwserver:~/LaserWeb4 $ npm run watch-dev

Will continually and quickly re-build LW4 to the `dist` folder but I prefer:

    pi@lwserver:~/LaserWeb4 $ npm run start-dev

* This is great; it builds the app, then serves it on a local port (8080 by default)
* It then monitors the repo and fast re-builds as needed when you modify files
* The served app is restarted whenever it rebuilds, and errors get shown in the browser as well as the cli

## Production Builds
Production builds (`npm run bundle-prod`) are smaller & faster, but slower to compile, and lack debug mappings etc. They are intended to be used during releasing/deployment and are not of much interest here unless you are planning on releasing

# Notes:

## Not the end
I'm still working on this... I want to add an architecture overview, style and contributing guide. I intend to have a seperate 'releasing' guide that references this.

## Caveat for Pi3 model A (and Pi2's ?)
You can no longer build the frontend with a Pi3+ model A; with only 512Mb of memory it cannot compile without encountering out of memory errors.

