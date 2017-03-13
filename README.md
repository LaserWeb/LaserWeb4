# LaserWeb (0.4.0-alpha)

This repository is a "development environment" - and no regular user would have to touch this at all (dont download the repo from here, use the Download links below)

## Download
BETA testing releases are made available daily on https://github.com/LaserWeb/LaserWeb4-Binaries/

## Documentation
For more documentation, go to [CNCpro.co](http://cncpro.co)

## Community
Check the [LaserWeb/CNCWeb Google+ community](https://plus.google.com/u/0/communities/115879488566665599508) for updates on the progress of this iteration of Laserweb.

Other than that, this version is early, so check the [Issues tab](https://github.com/openhardwarecoza/LaserWeb4/issues) for "details".


## How to contribute ?
Same as Smoothieware [github guidline](http://smoothieware.org/github) :

1. Fork the original repositiory.
2. Clone the forked repository.
3. Create a new branch for your bugfix/feature.
4. Commit your changes and push it back on Github.
5. Submit your pull request (Only one feature per pull request).

# Developer Resources of interest:

The package list changes frequently; expect to do an **npm install** every time you do a git pull until things settle down.

## LaserWeb Development Environment

-------------------------------------------------------------
 * npm install          -  Install the development environment.
 * npm start            -  Start the live development server.
 * npm run bundle-dev   -  Bundle the project for development.
 * npm run bundle-prod  -  Bundle the project for production.
 * npm run build-docs   -  Build the sources documentations.
 * npm run installdev   -  Resolve git submodules and install.
 
-------------------------------------------------------------
```

## Push update to live gh-pages version

Once tested, push updates to Github Pages

```
git checkout gh-pages && git pull && git merge dev-es6 && npm run bundle-dev && git add dist && git commit -m regen && git push && git checkout dev-es6
```
