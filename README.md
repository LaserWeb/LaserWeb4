# LaserWeb (0.4.0-alpha)
Work In Progress...
For more documentation, go to [CNCpro.co](http://cncpro.co)

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

# Developer Resources of interest:

* https://camjackson.net/post/9-things-every-reactjs-beginner-should-know

# @tbfleming provides the following guidelines 

I can't think of a how-to, but here are some notes that may help.

* Application state is in a redux store.
  * e.g. document tree, operations, settings, camera position, current tab

* State is never modified, only replaced. This is critical for undo/redo support.
  New state shares objects with old state to save memory.

* Reducers are the only thing which can create new state. Actions tell the reducers
  what to do. Components render the state. They also install event callbacks which
  create actions and dispatch them to the store.

* Only objects which can be serialized to/from JSON go in the store, no regl objects,
  DOM nodes, image objects, etc. This is critical for state saving and loading.
  * e.g. Polygons are in a 2d arrays: [[x, y, x, y, ...], ...]
  * e.g. Images are in base-64-encoded strings

* React components convert objects to other forms as needed. Functions in lib/ aid this.

* The ```DocumentCacheHolder``` component converts document data into more usable forms.
  * It converts:
    * Polygon data [[x, y, x, y, ...], ...] into:
      * ```outlines```: array of Float32Array of (x, y, x, y, ...). This draws polygon outlines in regl.
      * ```triangles```: Float32Array of (x, y, x, y, ...), This draws polygon filled areas in regl.
    * Base-64-encoded image data into:
      * Browser's Image class
      * A regl texture
  * It monitors the store and regenerates cache data when needed.
  * It installs itself in React's context like react-redux's ```Provider```.
  * ```withDocumentCache()``` wraps other React components like react-redux's ```connect()```.
    It sets the component's ```props.documentCacheHolder```.

## Example: loading an SVG file.

* The Cam component sets up a callback for the file input
* The callback fetches the file, creates a loadDocument action with the file content, and dispatches it to the store
* The documents reducer handles the loadDocument action. It looks at the file type, sees that it's image/svg+xml, and passes it to the loadSvg reducer.
* The loadSvg reducer uses SnapSvg and functions in lib/ to convert the SVG and add it to a new state.
* The store triggers a UI render.

## One more note: 
Don't commit changes that webpack makes to **docs/** and **dist/** . You have to keep a very careful eye on git; it keeps wanting to commit those files, which will cause problems viewing diffs.

The package list changes frequently; expect to do an **npm install** every time you do a git pull until things settle down.

# Push update to live gh-pages version

Once tested, push updates to Github Pages

```
git checkout gh-pages && git pull && git merge dev-es6 && npm run bundle-dev && git add dist && git commit -m regen && git push && git checkout dev-es6
```
# LaserWeb Development Environment

-------------------------------------------------------------
 * npm install          -  Install the development environment.
 * npm start            -  Start the live development server.
 * npm run bundle-dev   -  Bundle the project for development.
 * npm run bundle-prod  -  Bundle the project for production.
 * npm run build-docs   -  Build the sources documentations.
 * npm run installdev   -  Resolve git submodules and install.
 
-------------------------------------------------------------
```
