import canvasFilters from './canvas-filters'

// CanvasGrid class
class CanvasGrid {
    // Class constructor...
    constructor(settings) {
        // Init properties
        this.cellSize   = 1024
        this.scaleRatio = { x: 1, y: 1 }
        this.filters    = {}

        Object.assign(this, settings || {})

        if (! this.scaleRatio.x) {
            this.scaleRatio = { x: this.scaleRatio, y: this.scaleRatio }
        }

        this.size   = { width: 0, height: 0, cols: 0, rows: 0 }
        this.file   = null
        this.image  = null
        this.url    = null
        this.canvas = []
        this.pixels = []
    }

    // <input> can be Image, File, URL object or URL string (http://* or data:image/*)
    load(input) {
        // Load File object
        if (input instanceof File) {
            return this.loadFromFile(input)
        }

        // Load Image object
        if (input instanceof Image) {
            return this.loadFromImage(input)
        }

        // Load URL object
        if (typeof input === 'string' || input instanceof URL) {
            return this.loadFromURL(input.trim())
        }

        // Return rejected promise with an Error object
        return Promise.reject(new Error('Unsupported input format.'))
    }

    // Load image
    _loadImage(src, reject, resolve) {
        // Create Image object
        let image = new Image()

        // Register for load and error events
        image.onload = event => {
            this.loadFromImage(image).then(resolve).catch(reject)
        }

        image.onerror = event => {
            reject(new Error('An error occurred while loading the image : ' + src))
        }

        // Load the image from File url
        image.src = src
    }

    // Load from File object
    loadFromFile(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof File)) {
                reject(new Error('Input param must be a File object.'))
            }

            // Set input file
            this.file = input

            // Load image
            this._loadImage(URL.createObjectURL(input), reject, resolve)
        })
    }

    // Load from URL object or string
    loadFromURL(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof URL) && typeof input !== 'string') {
                reject(new Error('Input param must be a URL string or object.'))
            }

            // Create url object
            let url = input instanceof URL ? input : new URL(input)

            // Set url
            this.url = url

            // Load image
            this._loadImage(url, reject, resolve)
        })
    }

    // Load from Image object
    loadFromImage(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof Image)) {
                reject(new Error('Input param must be a Image object.'))
            }

            // Set input image
            this.image = input

            // Process image
            this._processImage()

            // Resolve the promise
            resolve(this)
        })
    }

    _processImage() {
        // Reset canvas grid
        this.canvas = []
        this.pixels = []

        // Calculate grid size
        let width  = Math.round(this.image.width * this.scaleRatio.x)
        let height = Math.round(this.image.height * this.scaleRatio.y)
        let cols   = Math.ceil(width / this.cellSize)
        let rows   = Math.ceil(height / this.cellSize)

        this.size = { width, height, cols, rows }

        // Create canvas grid
        let line    = null
        let canvas  = null
        let pixels  = null
        let context = null

        let x  = null // cols
        let y  = null // rows
        let sx = null // scaled cols
        let sy = null // scaled rows
        let sw = null // scaled width
        let sh = null // scaled height

        // For each line
        for (y = 0; y < this.size.rows; y++) {
            // Reset current line
            line   = []
            pixels = []

            // For each column
            for (x = 0; x < this.size.cols; x++) {
                // Create canvas element
                canvas = document.createElement('canvas')

                // Set canvas size
                if (x === 0 || x < (this.size.cols - 1)) {
                    canvas.width = this.size.width < this.cellSize
                                 ? this.size.width : this.cellSize
                }
                else {
                    // Get the rest for the last item (except the first one)
                    canvas.width = this.size.width % this.cellSize
                }

                if (y === 0 || y < (this.size.rows - 1)) {
                    canvas.height = this.size.height < this.cellSize
                                  ? this.size.height : this.cellSize
                }
                else {
                    // Get the rest for the last item (except the first one)
                    canvas.height = this.size.height % this.cellSize
                }

                // Get canvas 2d context
                context = canvas.getContext('2d')

                // Fill withe background (avoid alpha chanel calculation)
                context.fillStyle = 'white'
                context.fillRect(0, 0, canvas.width, canvas.height)

                // Draw the part of image in the canvas (scale)
                sw = canvas.width / this.scaleRatio.x
                sh = canvas.height / this.scaleRatio.y
                sx = x * this.cellSize / this.scaleRatio.x
                sy = y * this.cellSize / this.scaleRatio.y

                context.drawImage(
                    this.image, sx, sy, sw, sh,
                    0, 0, canvas.width, canvas.height
                )

                // Apply image filters
                canvasFilters(canvas, this.filters)

                // Add the canvas to current line
                line.push(canvas)

                // Add the canvas image data to current line
                pixels.push(context.getImageData(0, 0, canvas.width, canvas.height).data)
            }

            // Add the line to canvas grid
            this.pixels.push(pixels)
            this.canvas.push(line)
        }
    }

    getPixel(x, y) {
        // Test coords validity
        x = parseInt(x)
        y = parseInt(y)

        if (isNaN(x) || isNaN(y)) {
            throw new Error('[x, y] params must be Integer.')
        }

        // Test coords range
        if (x < 0 || x >= this.size.width) {
            throw new Error('Out of range: x = ' + x + ', max: ' + this.size.width)
        }

        if (y < 0 || y >= this.size.height) {
            throw new Error('Out of range: y = ' + y + ', max: ' + this.size.height)
        }

        // Calculate target canvas coords
        let col = parseInt(x / this.cellSize)
        let row = parseInt(y / this.cellSize)

        // Adjuste x/y values relative to canvas origin
        col && (x -= this.cellSize * col)
        row && (y -= this.cellSize * row)

        // Get pixel data
        let cellSize  = this.cellSize;

        if (this.size.width < cellSize) {
            cellSize = this.size.width
        }
        else if (this.size.width < cellSize * (col + 1)) {
            cellSize = this.size.width % cellSize
        }

        let i         = (y * (cellSize * 4)) + (x * 4)
        let pixels    = this.pixels[row][col]
        let pixelData = pixels.slice(i, i + 4)

        return {
            color : { r: pixelData[0], g: pixelData[1], b: pixelData[2], a: pixelData[3] },
            gray  : (pixelData[0] + pixelData[1] + pixelData[2]) / 3,
            grid  : { col, row },
            coords: { x, y }
        }
    }
}

// Exports
export { CanvasGrid }
export default CanvasGrid
