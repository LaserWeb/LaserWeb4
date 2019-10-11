// Imports
import { Tag } from './tag'
import { TagParser } from './tagparser'

// SVG parser class
class Parser {
    // Class constructor...
    constructor(settings) {
        // Defaults settings
        settings = settings || {}

        // Init properties
        this.element  = null // XML document Element object
        this.editor   = null // Editor info { name, version, fingerprint }
        this.document = null // Document info { width, height, viewBox }
        this.defs     = null // Defined <defs> (DOM) nodes list by id
        this.tags     = null // Tag objects hierarchy

        // Trace settings (Arc, Bezier)
        this.traceSettings = Object.assign({
            linear       : true, // Linear trace mode
            step         : 0.01, // Step resolution if linear mode = false
            resolution   : 100,  // Number of segments we use to approximate arc length
            segmentLength: 1,    // Segment length
        }, settings.traceSettings || {})

        // Supported tags by this lib
        this.supportedTags = [
            'svg', 'g', 'defs', 'use',
            'line', 'polyline', 'polygon',
            'rect', 'circle', 'ellipse', 'path',
            'title', 'desc', 'image', 'text'
        ]

        // Tags list to includes/excludes
        this.parseTags = settings.includes || this.supportedTags
        this.skipTags  = settings.excludes || ['#text', '#comment']  // silent (no warning)

        // User onTag callback ?
        settings.onTag && this.onTag(settings.onTag, settings.onTagContext)
    }

    // Load raw XML string, XMLDocument, Element or File object
    load(input) {
        // Load raw XML string
        if (typeof input === 'string') {
            return this.loadFromString(input)
        }

        // Load File object
        if (input instanceof File) {
            return this.loadFromFile(input)
        }

        // Load XMLDocument object
        if (input instanceof XMLDocument) {
            return this.loadFromXMLDocument(input)
        }

        // Load Element object
        if (input instanceof Element) {
            return this.loadFromElement(input)
        }

        // Return rejected promise with an Error object
        return Promise.reject(new Error('Unsupported input format.'))
    }

    // Load from Element object
    loadFromElement(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof Element)) {
                reject(new Error('Input param must be a Element object.'))
            }

            // Parser error
            if (input.nodeName === 'parsererror') { // FF
                reject(new Error(input.textContent))
            }

            if (input.nodeName === 'html' && input.getElementsByTagName('parsererror')) { // Chrome
                reject(new Error(input.getElementsByTagName('parsererror')[0].textContent))
            }

            // Set document element
            this.element = input

            // Resolve promise
            resolve(input)
        })
    }

    // Load from XMLDocument object
    loadFromXMLDocument(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof XMLDocument)) {
                reject(new Error('Input param must be a XMLDocument object.'))
            }

            // Load from Element...
            this.loadFromElement(input.documentElement).then(resolve).catch(reject)
        })
    }

    // Load raw XML string
    loadFromString(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (typeof input !== 'string') {
                reject(new Error('Input param must be a string.'))
            }

            // Parse svg editor
            this._parseEditor(input)

            // Parse string as DOM object
            let parser = new DOMParser()
            let XMLDoc = parser.parseFromString(input, 'text/xml')

            // Load from XMLDocument...
            this.loadFromXMLDocument(XMLDoc).then(resolve).catch(reject)
        })
    }

    // Try to get the svg editor from input string
    _parseEditor(input) {
        // Reset editor
        this.editor = {
            name       : 'unknown',
            version    : null,
            fingerprint: null
        }

        // Fingerprint matches
        let fingerprint

        // Inkscape
        fingerprint = input.match(/<!-- Created with Inkscape .*-->/i)

        if (fingerprint) {
            this.editor.name        = 'inkscape'
            this.editor.fingerprint = fingerprint[0]

            return this.editor
        }

        // Illustrator
        fingerprint = input.match(/<!-- Generator: Adobe Illustrator ([0-9\.]+), .*-->/i)

        if (fingerprint) {
            this.editor.name        = 'illustrator'
            this.editor.version     = fingerprint[1]
            this.editor.fingerprint = fingerprint[0]

            return this.editor
        }

        // Return default
        return this.editor
    }

    // Load from File object
    loadFromFile(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof File)) {
                reject(new Error('Input param must be a File object.'))
            }

            // Create file reader
            let reader = new FileReader()

            // Register reader events handlers
            reader.onload = event => {
                this.loadFromString(event.target.result).then(resolve).catch(reject)
            }

            reader.onerror = event => {
                reject(new Error('Error reading file : ' + input.name))
            }

            // Finally read input file as text
            reader.readAsText(input)
        })
    }

    // Parse the (loaded) element
    parse(input) {
        // Reset properties
        this.document = null
        this.defs     = {}
        this.tags     = null

        // Load input if provided
        if (input) {
            return new Promise((resolve, reject) => {
                this.load(input).then(() => {
                    resolve(this.parse())
                }).catch(reject)
            })
        }

        // Start parsing element
        return new Promise((resolve, reject) => {
            // If no element is loaded
            if (! this.element) {
                reject(new Error('No element is loaded, call the load method before.'))
            }

            // Parse the main Element (recursive)
            this.tags = this._parseElement(this.element)

            if (! this.tags) {
                reject(new Error('No supported tags found.'))
            }

            // Apply matrix (recursive)
            this.tags.applyMatrix()

            // Resolve the promise
            resolve(this.tags)
        })
    }

    // On tag callback
    _onTag(tag) {
        //console.info('onTag:', tag)
    }

    // Register on tag callback
    onTag(callback, context) {
        this._onTag = tag => callback.call(context || this, tag)
    }

    // Parse the provided Element and return an Tag collection (recursive)
    _parseElement(element, parent) {
        // Create base tag object
        let tag = new Tag(element, parent)

        // Exluded tag ?
        if (this.skipTags.indexOf(tag.name) !== -1) {
            return null // silent
        }

        // Supported tag ?
        if (this.parseTags.indexOf(tag.name) === -1) {
            return this._skipTag(tag, 'unsupported')
        }

        // Parse the tag
        let tagParser = new TagParser(tag, this)

        if (! tagParser.parse()) {
            return false
        }

        // Call the on tag callback
        this._onTag(tag)

        // Parse child nodes
        let childTag

        element.childNodes.forEach(childNode => {
            // Parse child element
            if (childTag = this._parseElement(childNode, tag)) {
                tag.addChild(childTag)
            }
        })

        // Empty group
        if (['svg', 'g'].indexOf(tag.name) !== -1 && ! tag.children.length) {
            return this._skipTag(tag, 'empty')
        }

        // Return tag object
        return tag
    }

    // Log skip tag warning message
    _skipTag(tag, message) {
        console.warn('Skip tag :', message + ':', tag)
        return false
    }

    // Log skip tag attribute warning message
    _skipTagAttr(tag, attr, message) {
        console.warn('Skip tag attribute :', message + ':', attr, tag)
        return false
    }

}

// Exports
export { Parser }
export default Parser
