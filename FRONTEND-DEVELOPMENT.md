# Machine Prep
Note; this log was generated on a Pi4 4Gb running from a SSD. However, I also test on a Pi3 Model B+ and a Pi3 Model A.

For support please go to the MakerForums at: https://forum.makerforums.info/c/laserweb-cncweb/

These Instructions should work for all Pi 3 and 4 models running the Buster and Bullseye releases. Also see the [wiki](https://github.com/LaserWeb/lw.comm-server/wiki/Manual-Installation-(RasPi)) page about Pi installation for more info and notes on how to run LaserWeb4 as a service.

## Machines running Bullseye
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

## Machines running Buster
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

    we also need an extra Node package not included by npm6 by standard
    pi@buster:~ $ npm install ip
    + ip@1.1.5
    ... and more info about npm package states

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
    Here we are double-checking we are on 'dev-es6'; the current default branch.

    Now we must initilise and update the LW4 submodules
    pi@lwserver:~/LaserWeb4 $ git submodule init
    Submodule 'src/data/lw.machines' (https://github.com/LaserWeb/lw.machines) registered for path 'src/data/lw.machines'
    Submodule 'src/data/lw.materials' (https://github.com/LaserWeb/lw.materials.git) registered for path 'src/data/lw.materials'

    pi@lwserver:~/LaserWeb4 $ git submodule update
    Cloning into '/home/pi/LaserWeb/LaserWeb4/src/data/lw.machines'...
    Cloning into '/home/pi/LaserWeb/LaserWeb4/src/data/lw.materials'...
    Submodule path 'src/data/lw.machines': checked out '685d9de193400a7bcf35d921eda21e4bedfbdc7b'
    Submodule path 'src/data/lw.materials': checked out 'dce9f9ae104030e192a9716f095988dc33c0c0cd'

## Build LaserWeb4
First we build laserweb4 and it's dependencies, then we create a new bundle for exporting to the comm-server

    pi@lwserver:~/lw.comm-server $ cd ~/LaserWeb4/

    pi@lwserver:~/LaserWeb4 $ npm install
    ... lots of output
    On my Pi3B+ this takes: 11m13s, on my Pi4/4Gb+ssd this takes: 4m02s
    On a first run approximately 130Mb of packages will be downloaded and cached



## Generate a distribution (aka Bundle) the server build
The results end up in the `dist` folder of the repo

    pi@lwserver:~/LaserWeb4 $ npm run bundle-dev
    ... lots of output
    On my Pi3B+ this takes: 2m19.803s, on my Pi4/4Gb+ssd this takes: 1m07s
    No additional data is downloaded for this

## Copy bundle into lw.comms.server
This is done from within the lw.comm-server, it expects to find the new bundle in ../LaserWeb4

    pi@lwserver:~/LaserWeb4 $ cd ../lw.comm-server/
    pi@lwserver:~/lw.comm-server $ npm run update_frontend
    ... lots of output

# Run the result

    pi@lwserver:~/lw.comm-server $ node server

    ***************************************************************
            ---- LaserWeb Comm Server 4.1.000 ----
    ***************************************************************
      Use  http://127.0.1.1:8000 to connect this server.

    * Updates:
      Remember to check the commit log on
      https://github.com/LaserWeb/lw.comm-server/commits/master
      regularly, to know about updates and fixes, and then when ready
      update accordingly by running git pull

    * Support:
      If you need help / support, come over to
      https://forum.makerforums.info/c/laserweb-cncweb/78
    ***************************************************************

    App connected! (id=0)
    INFO: Requesting Server Config

# Use
Browse to http://lwserver:8000/ from the target workstation

# Updating:
Pull the updates in using git
    pi@lwserver:~/lw.comm-server $ cd ~/LaserWeb4/
    pi@lwserver:~/LaserWeb4 $ git pull
    Already up to date.
If any updates show up you can then re-run the Build steps again to obtain them.

# Notes:
## Lots of Warnings in builds
The lw.comm-server and LaserWeb4 `npm` builds generate a lot of warnings and depreciation notices. As of the time of this document (12 Aug 2020) none of these resulted in a failure, but they deo look quite ominous.

If you are a JS/Node developer looking for a challenge, this would be a good target for some assistance in the project.

## Caveat for Pi3 model A (and Pi2's ?)
I have successfully followed these instructions on my 'real' target system; which is a Pi3+ model A; with only 512Mb of memory it struggled to complete the npm builds, but was successful in the end and serves LW4 very well.

The trick on low memory systems is that the `npm` actions fail due to low memory. But this is because npm uses a lot of memory while building, and doesnt free it up during the build. Repeatedly re-starting the build after such failures generally allows `npm` to eventually complete. The main LaserWeb4 build took four restarts, each time getting further through the build process until the final reatart was successful.
