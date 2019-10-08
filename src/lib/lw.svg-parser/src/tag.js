//subtree
import { Path, Point } from 'lw.svg-path'
import clipper from 'clipper-lib'

const DEG_TO_RAD = Math.PI / 180

// SVG tag class
class Tag {
    // Class constructor...
    constructor(element, parent) {
        // Init properties
        this.element  = element
        this.name     = element.nodeName.toLowerCase()
        this.parent   = parent || null
        this.layer    = null
        this.attrs    = {}
        this.children = []
        this.paths    = []
        this.matrix   = null
        this.path     = new Path()
        this.point    = new Point(0, 0)
        this.shapes   = []

        // Add first path
        this.paths.push(this.path)

        // Set the matrix
        this.setMatrix(this.parent && this.parent.matrix)

        // Clone parent attributes
        if (this.parent && (this.parent.name === 'g' || this.parent.name === 'svg')) {
            // Inherit layer name
            this.layer = this.parent.layer

            // Inherit parent attributes
            let excludes = ['transform', 'width', 'height']

            if (this.name !== 'g' && this.name !== 'svg') {
                excludes.push('viewBox')
            }

            Object.keys(this.parent.attrs).forEach(key => {
                if (excludes.indexOf(key) === -1) {
                    this.setAttr(key, this.parent.attrs[key])
                }
            })
        }
    }

    setAttr(name, value) {
        this.attrs[name] = value
    }

    getAttr(name, defaultValue) {
        return this.attrs[name] !== undefined ? this.attrs[name]
            : (defaultValue !== undefined ? defaultValue : null)
    }

    getLayerName() {
        if (this.name === 'g') {
            return this.getAttr('inkscape:label', this.getAttr('id', null))
        }
    }

    setLayerName(name) {
        if (this.name === 'g') {
            this.layer = name || this.getLayerName()
        }
    }

    addChild(childTag) {
        this.children.push(childTag)
    }

    clearPath() {
        this.path  = new Path()
        this.point = new Point(0, 0)
    }

    newPath() {
        if (this.path.length > 0) {
            this.clearPath()
            this.paths.push(this.path)
        }
    }

    closePath() {
        // Close path
        // this.path.close() is too constrained, which breaks some valid cases
        let close = false;
        if (!this.path.isClosed() && this.path.length > 1) {
            close = true;
            let firstPoint = this.path.getPoint(0);
            this.path.addPoint(firstPoint.x, firstPoint.y);
        }

        // Update current point
        let point  = this.path.getPoint(-1)
        this.point = new Point(point.x, point.y)

        // Return close result
        return close
    }

    addPoint(x, y, relative) {
        // Relative from the last point
        if (relative) {
            x += this.point.x
            y += this.point.y
        }

        // Add current point
        this.path.addPoint(x, y)

        // Update current point
        this.point = new Point(x, y)
    }

    addPoints(points, relative) {
        // For each couple of points
        for (let i = 0, il = points.length; i < il; i += 2) {
            this.addPoint(points[i], points[i + 1], relative)
        }
    }

    setMatrix(matrix) {
        this.matrix = matrix || [1, 0, 0, 1, 0, 0]
    }

    addMatrix(matrix) {
        this.matrix = [
            this.matrix[0] * matrix[0] + this.matrix[2] * matrix[1],
            this.matrix[1] * matrix[0] + this.matrix[3] * matrix[1],
            this.matrix[0] * matrix[2] + this.matrix[2] * matrix[3],
            this.matrix[1] * matrix[2] + this.matrix[3] * matrix[3],
            this.matrix[0] * matrix[4] + this.matrix[2] * matrix[5] + this.matrix[4],
            this.matrix[1] * matrix[4] + this.matrix[3] * matrix[5] + this.matrix[5]
        ]
    }

    translate(x, y) {
        y = y === undefined ? 0 : y
        this.addMatrix([1, 0, 0, 1, x, y])
    }

    rotate(angle, x, y) {
        angle = angle * DEG_TO_RAD

        if (arguments.length == 2) {
            this.addMatrix([1, 0, 0, 1, x, y])
        }

        this.addMatrix([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0])

        if (arguments.length == 2) {
            this.addMatrix([1, 0, 0, 1, -x, -y])
        }
    }

    scale(x, y) {
        y = y === undefined ? x : y
        this.addMatrix([x, 0, 0, y, 0, 0])
    }

    skewX(angle) {
        this.addMatrix([1, 0, Math.tan(angle * DEG_TO_RAD), 1, 0, 0])
    }

    skewY(angle) {
        this.addMatrix([1, Math.tan(angle * DEG_TO_RAD), 0, 1, 0, 0])
    }

    applyMatrix(matrix) {
        matrix && this.addMatrix(matrix)

        this.paths.forEach(path => {
            path.transform(this.matrix)
        })

        this.shapes.forEach(shape => {
            shape.outer.transform(this.matrix)
            shape.holes.forEach(hole => {
                hole.transform(this.matrix)
            })
        })

        this.setMatrix(null)

        this.children.forEach(tag => {
            tag.applyMatrix(matrix)
        })
    }

    getPaths() {
        return this.paths
    }

    getShapes() {
        // No shapes...
        if (this.getAttr('fill', 'none') === 'none' || ! this.paths[0].length) {
            return this.shapes
        }

        // Get fill rule
        let fillRule = this.getAttr('fill-rule', 'nonzero')
            fillRule = fillRule === 'nonzero' ? clipper.PolyFillType.pftNonZero : clipper.PolyFillType.pftEvenOdd

        // Create clipper path
        let cPolyTree    = new clipper.PolyTree()
        let cClipper     = new clipper.Clipper()
        let clipperScale = 10000000
        let clipperPaths = []

        this.paths.forEach(path => {
            clipperPaths.push(path.getClipperPoints(clipperScale))
        })

        cClipper.AddPaths(clipperPaths, clipper.PolyType.ptSubject, true)
        cClipper.Execute(clipper.ClipType.ctUnion, cPolyTree, fillRule, fillRule)

        let paths     = clipper.Clipper.PolyTreeToPaths(cPolyTree)
        let polygones = clipper.Clipper.SimplifyPolygons(paths, fillRule)

        // Single path (no hole)
        if (this.paths.length > 1) {
            cClipper.Clear()
            cClipper.StrictlySimple = true
            cPolyTree = new clipper.PolyTree()
            cClipper.AddPaths(polygones, clipper.PolyType.ptSubject, true)
            cClipper.Execute(clipper.ClipType.ctUnion, cPolyTree, fillRule, fillRule)
        }

        // PolyTree to ExPolygons
        let toPath     = path => new Path().fromClipperPoints(path, 1 / clipperScale)
        let exPolygons = clipper.JS.PolyTreeToExPolygons(cPolyTree)
        this.shapes    = exPolygons.map(exPolygon => {
            return {
                outer: toPath(exPolygon.outer),
                holes: exPolygon.holes.map(toPath)
            }
        })

        // Return shapes...
        return this.shapes
    }
}

// Exports
export { Tag }
export default Tag
