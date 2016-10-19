# LaserWeb (0.4.0-alpha)
Work In Progress...

## Community
Check the [LaserWeb/CNCWeb Google+ community](https://plus.google.com/u/0/communities/115879488566665599508) for updates on the progress of this iteration of Laserweb.

Other than that, this is early, so check the [Issues tab](https://github.com/openhardwarecoza/LaserWeb4/issues) for "details".

## Looking for a functional version ?
Head over **[LaserWeb3](https://github.com/openhardwarecoza/LaserWeb3/)** instead if you'd like to use LaserWeb.

We'll let you know when LW4 is ready for Prime Time.

# Developers Note!
We use [GitHub Projects](https://github.com/openhardwarecoza/LaserWeb4/projects) to manage this project!  Since we are now a multiperson team, please consider talking to the team often to avoid duplication, and other issues

## How to contribute ?
Same as Smoothieware [github guidline](http://smoothieware.org/github) :

1. Fork the original repositiory.
2. Clone the forked repository.
3. Create a new branch for your bugfix/feature.
4. Commit your changes and push it back on Github.
5. Submit your pull request (Only one feature per pull request).

# @tbfleming provides the following guidelines 

I can't think of a how-to, but here are some notes that may help.

Application state is in a redux store.
e.g. document tree, operations, settings, current tab

* State is never modified, only replaced. This is critical for undo/redo support. New state shares objects with old state to save memory.

* Reducers are the only thing which can create new state. Actions tell the reducers what to do. Components render the state. They also install event callbacks which create actions and dispatch them to the store.

* Only objects which can be serialized to/from JSON go in the store, no THREE objects, DOM nodes, image objects, etc. This is critical for state saving and loading.
e.g. The document tree represents meshes using an array: [x, y, z, x, y, z, ...]
e.g. The document tree will represent image data in base-64-encoded strings, or some other JSON-compatible form.

* React components convert objects to other forms as needed. Functions in lib/ aid this.
e.g. The BufferMesh component converts an array of [x, y, z, x, y, z, ...] into a THREE.mesh with a THREE.BufferGeometry. It regenerates things as needed when the state changes.


## Example: loading an SVG file.

* The Cam component sets up a callback for the file input
* The callback fetches the file, creates a loadDocument action with the file content, and dispatches it to the store
* The documents reducer handles the loadDocument action. It looks at the file type, sees that it's image/svg+xml, and passes it to the loadSvg reducer.
* The loadSvg reducer uses SnapSvg + functions in lib/ to convert the SVG and add it to a new state.
* The store triggers a UI render.

## One more note: 
Don't commit changes that webpack makes to **docs/** and **dist/** . You have to keep a very careful eye on git; it keeps wanting to commit those files, which will cause problems viewing diffs.

The package list changes frequently; expect to do an npm install every time you do a git pull until things settle down.

#LaserWeb Development Environment
-------------------------------------------------------------
 * npm install          -  Install the development environment.
 * npm start            -  Start the live development server.
 * npm run bundle-dev   -  Bundle the project for development.
 * npm run bundle-prod  -  Bundle the project for production.
 * npm run build-docs   -  Build the sources documentations.
-------------------------------------------------------------
