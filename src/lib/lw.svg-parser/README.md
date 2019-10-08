# lw.svg-parser
SVG parser for [LaserWeb/CNCWeb](https://github.com/LaserWeb/LaserWeb4).

## Supported tags
```html
<svg> <title> <desc>
<g> <defs> <use>
<line> <polyline> <polygon>
<rect> <circle> <ellipse>
<path> <image> <text>
```

## Features
- ViewBox, PreserveAspectRatio
- Clipping paths with [Clipper.js](https://sourceforge.net/projects/jsclipper/)
- Promise mechanism
- ES6 / UMD module

## Demo
https://lautr3k.github.io/lw.svg-parser/dist/example/

## Installation
Using NPM
```
npm install lw.svg-parser
```

Using GIT
```
git clone https://github.com/lautr3k/lw.svg-parser.git
cd svg-parser
npm install
```

Or download the last build from https://raw.githubusercontent.com/lautr3k/lw.svg-parser/master/dist/lw.svg-parser.js
```html
<script src="./lw.svg-parser.js"></script>
<script>
  var parser = SVGParser.Parser();
</script>
```

## Settings (all are optional)
```javascript
let settings = {
  includes: ['svg', 'g', 'defs', 'use', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'path', 'title', 'desc', 'image', 'text'],
  excludes: ['#text', '#comment'],
  traceSettings: { // Arc, Bezier curves only
    linear       : true, // Linear trace mode
    step         : 0.01, // Step resolution if linear mode = false
    resolution   : 100,  // Number of segments we use to approximate arc length
    segmentLength: 1     // Segment length
  },
  onTag: tag => {} // Called after a tag is parsed
}
```

## Usages
```javascript
import Parser from 'svg-parser'

let parser = new Parser(settings)

// <input> must be an raw XML string, XMLDocument, Element or File object
return parser.parse(input).then(tags => {
    console.log('tags:', tags);
    tags.forEach(tag => {
        tag.getPaths()  // return an array of Path objects (all contours + holes)
        tag.getShapes() // return an array of ExPolygons objects from Clipper.js (filled shapes)
    })
})
.catch(error => {
    console.error('error:', error);
});
```

After the main `<svg>` tag was parsed you can access this two properties on the parser instance :

```javascript
parser.editor   // Editor info { name, version, fingerprint }
parser.document // Document info { width, height, viewBox }
                // where viewBox is { x, y, width, height }
```
