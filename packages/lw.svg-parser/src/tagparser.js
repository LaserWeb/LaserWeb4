import { Arc, CubicBezier, QuadricBezier } from 'lw.svg-curves'
import { Point, Path } from 'lw.svg-path'

// SVG tag parser
class TagParser {
    // Class constructor...
    constructor(tag, parser) {
        // Init properties
        this.tag            = tag
        this.parser         = parser
        this.currentCommand = null
        this.lastCommand    = null
        this.pathData       = null
        this.traceSettings  = parser.traceSettings
    }

    parse() {
        // Get internal parser from node name
        let handler = this['_' + this.tag.name]

        // Implemented tag handler?
        if (! handler || typeof handler !== 'function') {
            return this.parser._skipTag(this.tag, 'not yet implemented')
        }

        // Parse tag attributes
        this._parseTagAttrs()

        // Parse tag
        return handler.call(this)
    }

    // Parse the tag attributes
    _parseTagAttrs() {
        // Get tag attributes
        let attrs = this.tag.element.attributes

        if (! attrs) {
            return null
        }

        // Get viewBox attribute if any
        let viewBox = attrs.getNamedItem('viewBox')

        if (viewBox) {
            this.tag.setAttr('viewBox', this._normalizeTagAttrPoints(viewBox))
        }

        // For each attribute
        let attr, value, style

        Object.keys(attrs).some(key => {
            // Current attribute
            attr = attrs[key]

            // Normalize attribute value
            value = this._normalizeTagAttr(attr)

            if (value === false) {
                return false // continue
            }

            // Special case
            if (attr.nodeName === 'style') {
                style = value
            }
            else {
                // Set new attribute name/value
                this.tag.setAttr(attr.nodeName, value)
            }
        })

        // If style attribute (override tag attributes)
        // TODO get/parse global style and override this one...
        style && style.replace(/;$/, '').split(';').some(attr => {
            // Current style
            attr = attr.split(':')
            attr = { nodeName: attr[0], nodeValue: attr[1] }

            // Normalize attribute value
            value = this._normalizeTagAttr(attr)

            if (value === false) {
                return false // continue
            }

            // Set new attribute name/value
            this.tag.setAttr(attr.nodeName, value)
        })

        // Set inherited color
        let colorsAttrs = ['fill', 'stroke', 'color']

        colorsAttrs.forEach(attrName => {
            if (this.tag.getAttr(attrName) === 'inherit') {
                this.tag.setAttr(attrName, this.tag.parent.getAttr(attrName, 'none'))
            }
        })

        // Parse viewBox attribute
        this._parseViewBoxAttr()

        // Parse transform attribute
        this._parseTransformAttr()
    }

    // Normalize tag attribute
    _normalizeTagAttr(attr) {
        // Normalize whitespaces
        let value = attr.nodeValue
            .replace(/(\r?\n|\r)+/gm, ' ') // Remove all new line chars
            .replace(/\s+/gm, ' ')         // Reduce multiple whitespaces
            .trim()                        // Remove trailing whitespaces

        if (! value.length) {
            return this.parser._skipTagAttr(this.tag, attr, 'empty')
        }

        // Filters
        switch (attr.nodeName) {
            // Normalize size unit -> to px
            case 'x':
            case 'y':
            case 'width':
            case 'height':
                value = this._normalizeTagAttrUnit(attr)
            break

            case 'x1':
            case 'y1':
            case 'x2':
            case 'y2':
            case 'r':
            case 'rx':
            case 'ry':
            case 'cx':
            case 'cy':
            case 'font-size':
            case 'stroke-width':
                value = this._normalizeTagAttrUnit(attr, true)
            break

            // Normalize points attribute
            case 'points':
            //case 'viewBox':
                value = this._normalizeTagAttrPoints(attr)
            break

            case 'viewBox':
                value = false
            break

            // Range limit to [0 - 1]
            case 'opacity':
            case 'fill-opacity':
            case 'stroke-opacity':
                value = this._normalizeTagAttrRange(attr, 0, 1)
            break

            case 'preserveAspectRatio':
                value = this._normalizeTagAttrPreserveAspectRatio(attr)
            break
        }

        // Return normalized value
        return value
    }

    // Normalize attribute unit to px
    _normalizeTagAttrUnit(attr, ratio) {
        let stringValue = attr.nodeValue.toLowerCase()
        let floatValue  = parseFloat(stringValue)

        if (isNaN(floatValue)) {
            return this.parser._skipTagAttr(this.tag, attr, 'only numeric value allowed')
        }

        if (stringValue.indexOf('mm') !== -1) {
            return floatValue * 3.5433070869
        }

        if (stringValue.indexOf('cm') !== -1) {
            return floatValue * 35.433070869
        }

        if (stringValue.indexOf('in') !== -1) {
            return floatValue * 90.0
        }

        if (stringValue.indexOf('pt') !== -1) {
            return floatValue * 1.25
        }

        if (stringValue.indexOf('pc') !== -1) {
            return floatValue * 15.0
        }

        if (stringValue.indexOf('%') !== -1) {
            let viewBox = this.tag.getAttr('viewBox', this.tag.parent && this.tag.parent.getAttr('viewBox'))

            switch (attr.nodeName) {
                case 'x':
                case 'width':
                    floatValue *= viewBox[2] / 100
                break
                case 'y':
                case 'height':
                    floatValue *= viewBox[3] / 100
                break
            }
        }

        if (stringValue.indexOf('em') !== -1) {
            let fontSize = this.tag.getAttr('font-size', 16)

            switch (attr.nodeName) {
                case 'x':
                case 'y':
                case 'width':
                case 'height':
                    floatValue *= fontSize
                break
            }
        }

        return floatValue
    }

    // Normalize points attribute
    _normalizeTagAttrPoints(attr) {
        let points = this._parseNumbers(attr.nodeValue)

        if (points === false) {
            return this.parser._skipTagAttr(this.tag, attr, 'only numeric values are allowed')
        }

        if (! points.length) {
            return this.parser._skipTagAttr(this.tag, attr, 'empty points list')
        }

        if (points.length % 0) {
            return this.parser._skipTagAttr(this.tag, attr, 'the number of points must be even')
        }

        return points
    }

    // Normalize range attribute like "opacity"
    _normalizeTagAttrRange(attr, min, max) {
        let stringValue = attr.nodeValue.trim()
        let floatValue  = parseFloat(stringValue)

        if (isNaN(floatValue)) {
            return this.parser._skipTagAttr(this.tag, attr, 'only numeric values are allowed')
        }

        if (floatValue < min || floatValue > max) {
            return this.parser._skipTagAttr(this.tag, attr, 'out of range [' + min + ', ' + max + ']')
        }

        return floatValue
    }

    // Parse points string as numbers array
    _parseNumbers(points) {
        // http://stackoverflow.com/questions/638565/parsing-scientific-notation-sensibly
        if (typeof points === 'string') {
            points = points.split(/([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?/g)
            .filter(point => {
                return point && ['', ','].indexOf(point.trim()) === -1
            })
        }

        // Normalize to float values
        points = points.map(parseFloat)

        // Test if all numbers is valid
        if (points.some(isNaN)) {
            return false
        }

        return points
    }

    // Normalize the preserveAspectRatio attribute
    _normalizeTagAttrPreserveAspectRatio(attr) {
        let params = {
            defer: false,
            align: 'none',
            meet : true,
            slice: false
        }

        let rawParams = attr.nodeValue

        if (rawParams.indexOf('defer') === 0) {
            rawParams    = rawParams.substr(6)
            params.defer = true
        }

        rawParams    = rawParams.split(' ')
        params.align = rawParams[0]
        params.meet  = rawParams[1] || 'meet'
        params.meet  = params.meet === 'meet'
        params.slice = ! params.meet

        return params
    }

    // Parse viewBox attribute and set transformations
    _parseViewBoxAttr() {
        // Get viewBox attribute
        let viewBox = this.tag.getAttr('viewBox', null)

        // No viewBox...
        if (viewBox === null) {
            return null
        }

        // Update size attributes
        let width  = this.tag.getAttr('width', viewBox[2])
        let height = this.tag.getAttr('height', viewBox[3])

        this.tag.setAttr('width' , width)
        this.tag.setAttr('height', height)

        // Scale to match viewBox
        // TODO clip path if preserveAspectRatio.slice
        let scaleX     = width  / viewBox[2]
        let scaleY     = height / viewBox[3]
        let translateX = viewBox[0]
        let translateY = viewBox[1]

        let preserveAspectRatio = this.tag.getAttr('preserveAspectRatio', 'meet xMidYMid')

        if (preserveAspectRatio) {
            let newWidth, newHeight

            if (preserveAspectRatio.meet) {
                if (scaleX > scaleY) {
                    scaleX   = scaleY
                    newWidth = viewBox[2] * scaleX
                }
                else if (scaleX < scaleY) {
                    scaleY    = scaleX
                    newHeight = viewBox[3] * scaleY
                }
            }
            else if (preserveAspectRatio.slice) {
                if (scaleX < scaleY) {
                    scaleX   = scaleY
                    newWidth = viewBox[2] * scaleX
                }
                else if (scaleX > scaleY) {
                    scaleY    = scaleX
                    newHeight = viewBox[3] * scaleY
                }
            }

            if (newWidth !== undefined) {
                if (preserveAspectRatio.align === 'xMidYMid') {
                    this.tag.translate((width - newWidth) / 2, 0)
                }
                else if (preserveAspectRatio.align === 'xMaxYMax') {
                    this.tag.translate(width - newWidth, 0)
                }
            }
            else if (newHeight !== undefined) {
                if (preserveAspectRatio.align === 'xMidYMid') {
                    this.tag.translate(0, (height - newHeight) / 2)
                }
                else if (preserveAspectRatio.align === 'xMaxYMax') {
                    this.tag.translate(0, height - newHeight)
                }
            }
        }

        //this.tag.scale(scaleX, scaleY)
        //this.tag.translate(-translateX, -translateY)
    }

    // Parse transform attribute and set transformations
    _parseTransformAttr() {
        // Get transform attribute
        let transformAttr = this.tag.getAttr('transform', null)

        // No transformation...
        if (transformAttr === null || ! transformAttr.length) {
            return null
        }

        // Parse attribute (split group on closing parenthesis)
        let transformations = transformAttr.split(')')

        // Remove last entry due to last ")" found
        transformations.pop()

        // For each transformation
        let transform, type, params

        transformations.some(raw => {
            // Split name and value on opening parenthesis
            transform = raw.split('(')

            // Invalid parts number
            if (transform.length !== 2) {
                return this.parser._skipTagAttr(this.tag, transformAttr, 'malformed') // continue
            }

            type = transform[0].trim()

            // Quik hack 1/2
            let func = type
            if (func === 'matrix') {
                func = 'addMatrix'
            }

            // Get tag transform method
            let tagTransform = this.tag[func]

            if (typeof tagTransform !== 'function') {
                return this.parser._skipTagAttr(this.tag, transformAttr, 'unsupported transform type :' + type)
            }

            params = transform[1].trim()
            params = this._parseNumbers(params)

            // Skip empty value
            if (! params.length) {
                return this.parser._skipTagAttr(this.tag, transformAttr, 'malformed transform type :' + type)
            }

            // Quik hack 2/2
            if (func == 'addMatrix') {
                params = [params]
            }

            // Call tag transform method like "tag.translate(param1, ..., paramN)"
            tagTransform.apply(this.tag, params)
        })
    }

    _newPath() {
        this.tag.newPath()
    }

    _clearPath() {
        this.tag.clearPath()
    }

    _closePath() {
        return this.tag.closePath()
    }

    _addPoints(points, relative) {
        if (! points.length) {
            return this.parser._skipTag(this.tag, 'empty points list')
        }

        if (points.length % 0) {
            return this.parser._skipTag(this.tag, 'the number of points must be even')
        }

        //relative = arguments.length < 2 && this.currentCommand.relative
        if (relative === undefined) {
            relative = this.currentCommand.relative
        }

        this.tag.addPoints(points, relative)
        return true
    }

    // SVG specs at https://www.w3.org/TR/SVG11/

    _svg() {
        // Only parse the root SVG tag as main document
        if (this.parser.document) {
            // Handled tag
            return true
        }

        // Get the document size
        let width  = this.tag.getAttr('width')
        let height = this.tag.getAttr('height')

        // Invalid size
        if (! width || width < 0 || ! height || height < 0) {
            throw new Error('Invalid document size: ' + width + ' / ' + height)
        }

        // Set document size
        this.parser.document = {
            width : width,
            height: height
        }

        // Get document viewBox or set default to document size
        let viewBox = this.tag.getAttr('viewBox', [0, 0, width, height])

        this.parser.document.viewBox = {
            x     : viewBox[0],
            y     : viewBox[1],
            width : viewBox[2],
            height: viewBox[3]
        }

        // Check inkscape version
        if (this.parser.editor.name === 'inkscape') {
            this.parser.editor.version = this.tag.getAttr('inkscape:version')
        }

        // Handled tag
        return true
    }

    _title() {
        // Register the first encountered title tag as document title
        if (this.parser.document && ! this.parser.document.title) {
            this.parser.document.title = this.tag.element.textContent
        }

        // Skipped tag
        return false
    }

    _desc() {
        // Register the first encountered desc tag as document description
        if (this.parser.document && ! this.parser.document.description) {
            this.parser.document.description = this.tag.element.textContent
        }

        // Skipped tag
        return false
    }

    _image() {
        // console.log(this.tag.getAttr('xlink:href'))
        // Handled tag
        return true
    }

    _text() {
        // console.log(this.tag.element.textContent)
        // Handled tag
        return true
    }

    _defs() {
        // Register all child element with an id attribute
        this.tag.element.childNodes.forEach(childNode => {
            childNode.id && (this.parser.defs[childNode.id] = childNode)
        })

        // Skipped tag
        return false
    }

    _use() {
        // Get the target id
        let target  = this.tag.getAttr('xlink:href').replace(/^#/, '')

        // Try to get the defined element
        let element = this.parser.defs[target]

        if (! element) {
            return this.parser._skipTag(this.tag, 'undefined reference [' + target + ']')
        }

        // Parse the defined element and set new parent from <use> tag parent
        let useTag = this.parser._parseElement(element, this.tag.parent)

        if (! useTag) {
            return this.parser._skipTag(this.tag, 'empty reference [' + target + ']')
        }

        // Set matrix from real parent (<use>)
        useTag.setMatrix(this.tag.matrix)

        // Replace the use tag with new one
        this.tag.parent.addChild(useTag)

        // Skipped tag
        return false
    }

    _g() {
        // Set the tag layer name
        this.tag.setLayerName()

        // Handled tag
        return true
    }

    _line() {
        // Handled tag
        return this._path([
            'M', this.tag.getAttr('x1'), this.tag.getAttr('y1'),
            'L', this.tag.getAttr('x2'), this.tag.getAttr('y2')
        ])
    }

    _polyline(close=false) {
        let points = this.tag.getAttr('points')
        let path   = ['M', points.shift(), points.shift(), 'L']

        path = path.concat(points)
        close && path.push('Z')

        // Handled tag
        return this._path(path)
    }

    _polygon() {
        // Handled like polyline but closed
        return this._polyline(true)
    }

    _rect() {
        // Get rectangle attributes
        let w  = this.tag.getAttr('width')
        let h  = this.tag.getAttr('height')
        let x  = this.tag.getAttr('x', 0)
        let y  = this.tag.getAttr('y', 0)
        let rx = this.tag.getAttr('rx', null)
        let ry = this.tag.getAttr('ry', null)

        // Simple rect
        if (!rx && !ry) {
            // Handled tag
            return this._path(['M', x, y, 'h', w, 'v', h, 'h', -w, 'z'])
        }

        // If a properly specified value is provided for ‘rx’, but not for ‘ry’,
        // then set both rx and ry to the value of ‘rx’ and vis-vera...
        if (rx === null) rx = ry
        if (ry === null) ry = rx

        // A negative value is an error
        if (rx === null || rx === null || rx < 0 || ry < 0) {
            // Skip tag
            return this.parser._skipTag(this.tag, 'negative value for "rx/ry" not allowed')
        }

        // If rx is greater than half of ‘width’, then set rx to half of ‘width’.
        // If ry is greater than half of ‘height’, then set ry to half of ‘height’.
        if (rx > w / 2) rx = w / 2
        if (ry > h / 2) ry = h / 2

        let dx = rx * 2
        let dy = ry * 2

        // Handled tag
        return this._path([
            'M', x + rx, y,
            'h', w - dx,
            'c', rx, 0, rx, ry, rx, ry,
            'v', h - dy,
            'c', 0, ry, -rx, ry, -rx, ry,
            'h', -w + dx,
            'c', -rx, 0, -rx, -ry, -rx, -ry,
            'v', -h + dy,
            'c', 0, 0, 0, -ry, rx, -ry,
            'z'
        ])
    }

    _circle() {
        let r = this.tag.getAttr('r', 0)

        if (r <= 0) {
            // Skipped tag
            return false
        }

        let cx = this.tag.getAttr('cx', 0)
        let cy = this.tag.getAttr('cy', 0)

        // Handled tag
        return this._path([
            'M', cx-r, cy,
            'A', r, r, 0, 0, 0, cx, cy+r,
            'A', r, r, 0, 0, 0, cx+r, cy,
            'A', r, r, 0, 0, 0, cx, cy-r,
            'A', r, r, 0, 0, 0, cx-r, cy,
            'Z'
        ])
    }

    _ellipse() {
        let rx = this.tag.getAttr('rx', 0)
        let ry = this.tag.getAttr('ry', 0)

        if (rx <= 0 || ry <= 0) {
            // Skipped tag
            return false
        }

        let cx = this.tag.getAttr('cx', 0)
        let cy = this.tag.getAttr('cy', 0)

        // Handled tag
        return this._path([
            'M', cx-rx, cy,
            'A', rx, ry, 0, 0, 0, cx, cy+ry,
            'A', rx, ry, 0, 0, 0, cx+rx, cy,
            'A', rx, ry, 0, 0, 0, cx, cy-ry,
            'A', rx, ry, 0, 0, 0, cx-rx, cy,
            'Z'
        ])
    }

    _paths(type, num, points) {
        if (points.length > num) {
            let handler, result = true

            while(result && points.length) {
                handler = this['_path' + type]
                result  = handler.call(this, points.splice(0, num))
            }

            return result
        }

        return null
    }

    _path(path) {
        // Provided path
        if (path && typeof path !== 'string') {
            path = path.join(' ')
        }

        // Get the paths data attribute value
        let dAttr = path || this.tag.getAttr('d', null)

        if (! dAttr) {
            // Skipped tag
            return false
        }

        // Split on each commands
        let commands = dAttr.match(/([M|Z|L|H|V|C|S|Q|T|A]([^M|Z|L|H|V|C|S|Q|T|A]+)?)/gi)

        if (! commands) {
            return this.parser._skipTag(this.tag, 'malformed "d" attribute')
        }

        // For each command...
        this.currentCommand = {
            raw     : null,
            type    : null,
            params  : null,
            relative: null
        }
        this.lastCommand = this.currentCommand
        this.pathData    = {}

        let handler    = null
        let parseError = false

        commands.some(raw => {
            // Remove trailing whitespaces
            raw = raw.trim()

            // Extract command char and params
            this.currentCommand.raw      = raw
            this.currentCommand.type     = raw[0].toUpperCase()
            this.currentCommand.params   = raw.substr(1).trim()
            this.currentCommand.relative = this.currentCommand.type !== raw[0]

            // Get path handler from command char
            handler = this['_path' + this.currentCommand.type]

            if (! handler || typeof handler !== 'function') {
                this.parser._skipTag(this.tag, 'unsupported path command [' + raw[0] + ']')
                return parseError = true // break
            }

            // Extract all numbers from arguments string
            this.currentCommand.params = this._parseNumbers(this.currentCommand.params)

            if (this.currentCommand.params === false) {
                this.parser._skipTag(this.tag, 'only numeric values are allowed in [' + this.currentCommand.raw + ']')
                return parseError = true // break
            }

            // Execute command parser
            if (! handler.call(this, this.currentCommand.params)) {
                return parseError = true // break
            }

            // Update last command
            this.lastCommand = {}

            Object.keys(this.currentCommand).forEach(key => {
                this.lastCommand[key] = this.currentCommand[key]
            })
        })

        // Skip tag
        if (parseError) {
            this._clearPath()
            return false
        }

        // Handled tag
        return true
    }

    _pathM(points) {
        // Current point
        let x  = this.tag.point.x
        let y  = this.tag.point.y
        let rl = this.currentCommand.relative

        // First point (start of new path)
        let firstPoint = points.splice(0, 2)

        // New path
        this._newPath()

        // Relative moveTo (First moveTo is always absolute)
        if (rl && this.tag.paths.length > 1) {
            firstPoint[0] += x
            firstPoint[1] += y
        }

        // Add first point
        let result = this._addPoints(firstPoint, false)

        // If is followed by multiple pairs of coordinates,
        // the subsequent pairs are treated as implicit lineto commands.
        if (result && points.length) {
            result = this._addPoints(points)
        }

        // Return result
        return result
    }

    _pathZ() {
        this._closePath()
        return true
    }

    _pathL(points) {
        return this._addPoints(points)
    }

    _pathH(points) {
        return points.every(x => {
            return this._addPoints([x, this.currentCommand.relative ? 0 : this.tag.point.y])
        })
    }

    _pathV(points) {
        return points.every(y => {
            return this._addPoints([this.currentCommand.relative ? 0 : this.tag.point.x, y])
        })
    }

    _pathC(points) {
        // Multiple paths
        let result = this._paths('C', 6, points)

        if (result !== null) {
            return result
        }

        // Single path
        let p1 = this.tag.point
        let rl = this.currentCommand.relative

        let x1 = points[0] + (rl ? p1.x : 0)
        let y1 = points[1] + (rl ? p1.y : 0)
        let x2 = points[2] + (rl ? p1.x : 0)
        let y2 = points[3] + (rl ? p1.y : 0)
        let x  = points[4] + (rl ? p1.x : 0)
        let y  = points[5] + (rl ? p1.y : 0)

        this.pathData.x2 = x2
        this.pathData.y2 = y2

        let p2 = new Point(x1, y1)
        let p3 = new Point(x2, y2)
        let p4 = new Point(x, y)

        //console.log('C', p1, p2, p3, p4)

        // p1  : starting point
        // p2  : control point
        // p3  : control point
        // p4  : end point
        let tracer = new CubicBezier(this.traceSettings)
        let coords = tracer.trace({ p1, p2, p3, p4 }) // => [x,y, x,y, ...]
        // let tracer = trace(CubicBezier, this.traceSettings)
        // let coords = tracer({ p1, p2, p3, p4 })

        // Trace the line
        return this._addPoints(coords, false)
    }

    _pathS(points) {
        // Multiple paths
        let result = this._paths('S', 4, points)

        if (result !== null) {
            return result
        }

        // Single path
        let p1 = this.tag.point
        let rl = this.currentCommand.relative

        let x1 = p1.x
        let y1 = p1.y

        if (this.lastCommand.type === 'S' || this.lastCommand.type === 'C') {
            x1 -= this.pathData.x2 - x1
            y1 -= this.pathData.y2 - y1
        }

        let x2 = points[0] + (rl ? p1.x : 0)
        let y2 = points[1] + (rl ? p1.y : 0)
        let x  = points[2] + (rl ? p1.x : 0)
        let y  = points[3] + (rl ? p1.y : 0)

        this.pathData.x2 = x2
        this.pathData.y2 = y2

        let p2 = new Point(x1, y1)
        let p3 = new Point(x2, y2)
        let p4 = new Point(x, y)

        //console.log('S', p1, p2, p3, p4)

        // p1  : starting point
        // p2  : control point
        // p3  : control point
        // p4  : end point
        let tracer = new CubicBezier(this.traceSettings)
        let coords = tracer.trace({ p1, p2, p3, p4 }) // => [x,y, x,y, ...]
        // let tracer = trace(CubicBezier, this.traceSettings)
        // let coords = tracer({ p1, p2, p3, p4 })

        // Trace the line
        return this._addPoints(coords, false)
    }

    _pathQ(points) {
        // Multiple paths
        let result = this._paths('Q', 4, points)

        if (result !== null) {
            return result
        }

        // Single path
        let p1 = this.tag.point
        let rl = this.currentCommand.relative

        let x1 = points[0] + (rl ? p1.x : 0)
        let y1 = points[1] + (rl ? p1.y : 0)
        let x  = points[2] + (rl ? p1.x : 0)
        let y  = points[3] + (rl ? p1.y : 0)

        this.pathData.x1 = x1
        this.pathData.y1 = y1

        let p2 = new Point(x1, y1)
        let p3 = new Point(x, y)

        //console.log('Q', p1, p2, p3)

        // p1  : starting point
        // p2  : control point
        // p3  : end point
        let tracer = new QuadricBezier(this.traceSettings)
        let coords = tracer.trace({ p1, p2, p3 }) // => [x,y, x,y, ...]

        // Trace the line
        return this._addPoints(coords, false)
    }

    _pathT(points) {
        // Multiple paths
        let result = this._paths('T', 2, points)

        if (result !== null) {
            return result
        }

        // Single path
        let p1 = this.tag.point
        let rl = this.currentCommand.relative

        let x1 = p1.x
        let y1 = p1.y

        if (this.lastCommand.type === 'Q' || this.lastCommand.type === 'T') {
            x1 -= this.pathData.x1 - x1
            y1 -= this.pathData.y1 - y1
        }

        let x = points[0] + (rl ? p1.x : 0)
        let y = points[1] + (rl ? p1.y : 0)

        this.pathData.x1 = x1
        this.pathData.y1 = y1

        let p2 = new Point(x1, y1)
        let p3 = new Point(x, y)

        //console.log('T', p1, p2, p3)

        // p1  : starting point
        // p2  : control point
        // p3  : end point
        let tracer = new QuadricBezier(this.traceSettings)
        let coords = tracer.trace({ p1, p2, p3 }) // => [x,y, x,y, ...]

        // Trace the line
        return this._addPoints(coords, false)
    }

    _pathA(points) {
        // Multiple paths
        let result = this._paths('A', 7, points)

        if (result !== null) {
            return result
        }

        // Single path
        let rl    = this.currentCommand.relative
        let p1    = this.tag.point
        let rx    = points[0]
        let ry    = points[1]
        let angle = points[2]
        let large = !!points[3]
        let sweep = !!points[4]
        let x     = points[5] + (rl ? p1.x : 0)
        let y     = points[6] + (rl ? p1.y : 0)
        let p2    = new Point(x, y)

        //console.log('A', p1, rx, ry, angle, large, sweep, p2)

        let tracer = new Arc(this.traceSettings)
        let coords = tracer.trace({ p1, rx, ry, angle, large, sweep, p2 }) // => [x,y, x,y, ...]

        // Trace the line
        return this._addPoints(coords, false)
    }
}

// Exports
export { TagParser }
export default TagParser
