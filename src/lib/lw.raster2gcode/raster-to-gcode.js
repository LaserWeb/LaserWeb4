import CanvasGrid from './canvas-grid'
import { getGenerator } from "../action2gcode/gcode-generator"

// RasterToGcode class
class RasterToGcode extends CanvasGrid {
    // Class constructor...
    constructor(settings) {
        // Defaults settings
        settings = Object.assign({
            ppi: { x: 254, y: 254 }, // Pixel Per Inch (25.4 ppi == 1 ppm)

            toolDiameter: 0.1,      // Tool diameter in millimeters
            rapidRate   : 1500,     // Rapid rate in mm/min (G0 F value) nullish value to disable
            feedRate    : 500,      // Feed rate in mm/min (G1 F value)
            rateUnit    : 'mm/min', // Rapid/Feed rate unit [mm/min, mm/sec]

            beamRange: { min: 0, max: 1 },   // Beam power range (Firmware value)
            beamPower: { min: 0, max: 100 }, // Beam power (S value) as percentage of beamRange
            beamCutoff: 0,                   // Beam cutoff when power is below given percentage

            milling  : false, // EXPERIMENTAL
            zSafe    : 5,     // Safe Z for fast move
            zSurface : 0,     // Usinable surface (white pixels)
            zDepth   : -10,   // Z depth (black pixels)
            passDepth: 1,     // Pass depth in millimeters

            offsets         : { X: 0, Y: 0 }, // Global coordinates offsets
            trimLine        : true,           // Trim trailing white pixels
            joinPixel       : true,           // Join consecutive pixels with same intensity
            burnWhite       : true,           // [true = G1 S0 | false = G0] on inner white pixels
            laserHasIntensity  : true,
            verboseG        : false,          // Output verbose GCode (print each commands)
            vertical        : false,          // Go vertically / reverse diagonal
            diagonal        : false,          // Go diagonally (increase the distance between points)
            overscan        : 0,              // Add some extra white space (in millimeters) before and after each line

            precision: { X: 2, Y: 2, S: 4 }, // Number of decimals for each commands

            gcodeGenerator: "default",

            nonBlocking: true, // Use setTimeout to avoid blocking the UI

            filters: {
                smoothing   : 0,      // Smoothing the input image ?
                brightness  : 0,      // Image brightness [-255 to +255]
                contrast    : 0,      // Image contrast [-255 to +255]
                gamma       : 0,      // Image gamma correction [0.01 to 7.99]
                grayscale   : 'none', // Graysale algorithm [average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
                shadesOfGray: 256,    // Number of shades of gray [2-256]
                invertColor : false   // Invert color...
            },

            onProgress       : null, // On progress callbacks
            onProgressContext: null, // On progress callback context

            onDone       : null, // On done callback
            onDoneContext: null, // On done callback context

            onAbort       : null, // On abort callback
            onAbortContext: null  // On abort callback context
        }, settings || {})

        // Init properties
        super(settings)

        // Milling settings
        if (this.milling) {
            if (this.zSafe < this.zSurface) {
                throw new Error('"zSafe" must be greater to "zSurface"')
            }

            this.passes = Math.abs(Math.floor(this.zDepth / this.passDepth))
        }

        // Negative beam size ?
        if (this.toolDiameter <= 0) {
            throw new Error('"toolDiameter" must be positive')
        }

        // Uniforme ppi
        if (! this.ppi.x) {
            this.ppi = { x: this.ppi, y: this.ppi }
        }

        // Calculate PPM = Pixel Per Millimeters
        this.ppm = {
            x: parseFloat((2540 / (this.ppi.x * 100)).toFixed(10)),
            y: parseFloat((2540 / (this.ppi.y * 100)).toFixed(10))
        }

        // Calculate scale ratio
        this.scaleRatio = {
            x: this.ppm.x / this.toolDiameter,
            y: this.ppm.y / this.toolDiameter
        }

        // State...
        this.running      = false
        this.gcode        = null
        this.gcodes       = null
        this.currentLine  = null
        this.lastCommands = null

        // Output size in millimeters
        this.outputSize = { width : 0, height: 0 }

        // Calculate beam offset
        this.beamOffset = this.toolDiameter * 1000 / 2000

        // Calculate real beam range
        this.realBeamRange = {
            min: this.beamRange.max / 100 * this.beamPower.min,
            max: this.beamRange.max / 100 * this.beamPower.max
        }

        // Adjuste feed rate to mm/min
        if (this.rateUnit === 'mm/sec') {
            this.feedRate  *= 60

            if (this.rapidRate) {
                this.rapidRate *= 60
            }
        }

        // Register user callbacks
        this._registerUserCallbacks(this)
    }

    // Register user callbacks
    _registerUserCallbacks(callbacks) {
        // Register user callbacks
        callbacks.onProgress && this.on('progress', callbacks.onProgress, callbacks.onProgressContext)
        callbacks.onAbort && this.on('abort', callbacks.onAbort, callbacks.onAbortContext)
        callbacks.onDone && this.on('done', callbacks.onDone, callbacks.onDoneContext)
    }

    // Process image
    _processImage() {
        // Call parent method
        super._processImage()

        // Calculate output size
        this.outputSize = {
            width : this.size.width  * (this.toolDiameter * 1000) / 1000,
            height: this.size.height * (this.toolDiameter * 1000) / 1000
        }
    }

    // Abort job
    abort() {
        this.running = false
    }

    // Process image and return gcode string
    run(settings) {
        if (this.running) {
            return
        }

        // Reset state
        this.running      = true
        this.gcode        = []
        this.gcodes       = []
        this.lastCommands = {}
        this.currentLine  = null

        // Defaults settings
        settings = settings || {}

        this.generator = getGenerator(this.gcodeGenerator, this);

        // G0 command
        this.G1 = this.generator.moveTool;
        this.G0 = this.burnWhite ? this.generator.moveTool : this.generator.moveRapid;

        // Register user callbacks
        this._registerUserCallbacks(settings)

        // Non blocking mode ?
        let nonBlocking = this.nonBlocking

        if (settings.nonBlocking !== undefined) {
            nonBlocking = settings.nonBlocking
        }

        // Add gcode header
        this._addHeader()

        // Scan type ?
        if (this.vertical) {
          if (this.diagonal) {
              this._scanDiagonallyBack(nonBlocking)
          }
          else {
              this._scanVertically(nonBlocking)
          }
        } else {
          if (this.diagonal) {
              this._scanDiagonally(nonBlocking)
          }
          else {
              this._scanHorizontally(nonBlocking)
          }
        }

        if (! nonBlocking) {
            return this.gcode
        }
    }

    _addHeader() {
        // Base headers
        this.gcode.push(
            '; Generated by LaserWeb (lw.raster-to-gcode.js)',
            '; Size       : ' + this.outputSize.width + ' x ' + this.outputSize.height + ' mm',
            '; PPI        : x: ' + this.ppi.x + ' - y: ' + this.ppi.y,
            '; PPM        : x: ' + this.ppm.x + ' - y: ' + this.ppm.y,
            '; Tool diam. : ' + this.toolDiameter + ' mm',
            '; Feed rate  : ' + this.feedRate + ' ' + this.rateUnit
        )

        if (this.rapidRate) {
           this.gcode.push('; Rapid rate  : ' + this.rapidRate + ' ' + this.rateUnit)
        }

        if (this.milling) {
            this.gcode.push(
                '; Z safe     : ' + this.zSafe,
                '; Z surface  : ' + this.zSurface,
                '; Z depth    : ' + this.zDepth
            )
        }
        else {
            if (this.laserHasIntensity) {
                this.gcode.push(
                    '; Beam range : ' + this.beamRange.min + ' to ' + this.beamRange.max,
                    '; Beam power : ' + this.beamPower.min + ' to ' + this.beamPower.max + ' %',
                    //'; Beam cutoff : ' + this.beamCutOff + ' %',
                )
            } else {
                this.gcode.push(
                    '; Beam power : no variable intensity; only ON/OFF (Laser intensity output (S) disabled in settings)'
                )
            }
        }

        // Print activated options
        let options = ['smoothing', 'trimLine', 'joinPixel', 'burnWhite', 'verboseG', 'vertical', 'diagonal']

        for (var i = options.length - 1; i >= 0; i--) {
            if (! this[options[i]]) {
                options.splice(i, 1)
            }
        }

        if (options.length) {
            this.gcode.push('; Options    : ' + options.join(', '))
        }

        // Set feed rates
        this.gcode.push('')

        if (this.rapidRate) {
           this.gcode.push('G0 F' + this.rapidRate)
        }

        this.gcode.push('G1 F' + this.feedRate)
        this.gcode.push('')
    }

    // Map S value to pixel power
    _mapPixelPower(value) {
        let range = this.milling ? { min: 0, max: this.zDepth } : this.realBeamRange
        return value * (range.max - range.min) / 255 + range.min
    }

    // Compute and return a command, return null if not changed
    _command(name, value) {
        //console.log("_command", value);
        // If the value argument is an object
        if (typeof value === 'object') {
            // Computed commands line
            let commands = Array.prototype.slice.call(arguments)
            let command, line = [], params = {};

            // for each command
            for (var i = 1, il = commands.length; i < il; i++) {
                command = this._command.apply(this, commands[i])
                command && line.push(command)
                command && (params[command[0].toLowerCase()] = command[1]);
            }

            // Return the line if not empty
            let result = line.length ? name.call(this.generator, params, name == this.lastCommands["function"]).split("\r\n") : null;
            this.lastCommands["function"] = name;
            return result;
        }

        // Format the value
        //console.log("value", value);
        value = value.toFixed(this.precision[name] || 0)

        // If the value was changed or if verbose mode on
        if (this.verboseG || value !== this.lastCommands[name]) {
            this.lastCommands[name] = value;
            return [name, value];
        }

        // No change
        return null
    }

    // Get a pixel power value from the canvas data grid
    _getPixelPower(x, y, defaultValue) {
        try {
            // Reverse Y value since canvas as top/left origin
            y = this.size.height - y - 1

            // Get pixel info
            let pixel = this.getPixel(x, y)

            // Reversed gray value [ 0 = white | 255 = black ]
            let power = 255 - pixel.gray;
            
            //Cutoff laser power if set in settings (settings is 0 - 100 value is 0 - 255)
            power = ((this.beamCutoff * 2.55) <= power) ? power : 0;

            return power
        }
        catch (error) {
            if (arguments.length === 3) {
                return defaultValue
            }
            throw error
        }
    }

    // Get a point from the current line with real world coordinates
    _getPoint(index) {
        // Get the point object from the current line
        let point = this.currentLine[index]

        // No point
        if (! point) {
            return null
        }

        // Commands
        point.G = point.s ? this.G1 : this.G0
        point.X = (point.x * this.toolDiameter) + this.offsets.X
        point.Y = (point.y * this.toolDiameter) + this.offsets.Y
        point.S = this._mapPixelPower(point.s)

        // Offsets
        if (this.vertical) {
            if (this.diagonal) {
                // tool offset
                point.Y += this.toolDiameter
                point.X += this.toolDiameter

                // Diagonal offsets
                if (point.first || point.lastWhite) {
                    point.X -= this.beamOffset
                    point.Y -= this.beamOffset
                }
                else if ((point.last || point.lastColored) && !point.firstColored) {
                    point.X += this.beamOffset
                    point.Y += this.beamOffset
                }
            }
            else {
                // Horizontal offset
                point.X += this.beamOffset

                // vertical offset
                if (point.first || point.lastWhite) {
                    point.Y += this.beamOffset
                }
                else if ((point.last || point.lastColored) && !point.firstColored) {
                    point.Y -= this.beamOffset
                }
            }
        } else {
            if (this.diagonal) {
                // tool offset
                point.Y += this.toolDiameter
                //point.X -= this.toolDiameter

                // diagonal offsets
                if (point.first || point.lastWhite) {
                    point.X += this.beamOffset
                    point.Y -= this.beamOffset
                }
                else if ((point.last || point.lastColored) && !point.firstColored) {
                    point.X -= this.beamOffset
                    point.Y += this.beamOffset
                }
            }
            else {
                // Vertical offset
                point.Y += this.beamOffset

                // Horizontal offset
                if (point.first || point.lastWhite) {
                    point.X += this.beamOffset
                }
                else if ((point.last || point.lastColored) && !point.firstColored) {
                    point.X -= this.beamOffset
                }
            }
        }

        // Return the point
        return point
    }

    // Remove all trailing white spaces from the current line
    _trimCurrentLine() {
        // Remove white spaces from the left
        let point = this.currentLine[0]

        while (point && ! point.p) {
            this.currentLine.shift()
            point = this.currentLine[0]
        }

        // Remove white spaces from the right
        point = this.currentLine[this.currentLine.length - 2]

        while (point && ! point.p) {
            this.currentLine.pop()
            point = this.currentLine[this.currentLine.length - 2]
        }

        // Return the new line length
        return this.currentLine.length
    }

    // Join pixel with same power
    _reduceCurrentLine() {
        // Line too short to be reduced
        if (this.currentLine.length < 3) {
            return this.currentLine.length
        }

        // Extract all points exept the first one
        let points = this.currentLine.splice(1)

        // Get current power
        let power = this.currentLine[0].p

        // For each extracted point
        for (var point, i = 0, il = points.length - 1; i < il; i++) {
            // Current point
            point = points[i]

            // On power change
            if (power !== point.p) {
                this.currentLine.push(point)
            }

            // Update power
            power = point.p
        }

        // Add last point
        this.currentLine.push(points[i])
    }

    // Add extra white pixels at the ends
    _overscanCurrentLine(reversed) {
        // Number of pixels to add on each side
        let pixels = this.overscan / this.ppm.x * this.scaleRatio.x

        // Get first/last point
        let firstPoint = this.currentLine[0]
        let lastPoint  = this.currentLine[this.currentLine.length - 1]

        // Is last white/colored point ?
        firstPoint.s && (firstPoint.lastWhite  = true)
        lastPoint.s  && (lastPoint.lastColored = true)

        // Reversed line ?
        reversed ? (lastPoint.s = 0) : (firstPoint.s = 0)

        // create start/end points
        let startPoint = {}
        let endPoint = {}
        if (this.vertical) {
            if (this.diagonal) {
                startPoint  = { x: firstPoint.x + pixels, y: firstPoint.y + pixels, s: 0, p: 0 }
                endPoint = { x: lastPoint.x - pixels, y: lastPoint.y - pixels , s: 0, p: 0 }
            } else {
                startPoint  = { x: firstPoint.x, y: firstPoint.y - pixels, s: 0, p: 0 }
                endPoint = { x: lastPoint.x, y: lastPoint.y + pixels , s: 0, p: 0 }
            }
        } else {
            if (this.diagonal) {
                startPoint  = { x: firstPoint.x - pixels, y: firstPoint.y + pixels, s: 0, p: 0 }
                endPoint = { x: lastPoint.x + pixels , y: lastPoint.y - pixels, s: 0, p: 0 }
            } else {
                startPoint  = { x: firstPoint.x - pixels, y: firstPoint.y, s: 0, p: 0 }
                endPoint = { x: lastPoint.x + pixels , y: lastPoint.y , s: 0, p: 0 }
            }
        }

        // Add start/end points to current line
        this.currentLine.unshift(startPoint)
        this.currentLine.push(endPoint)
    }

    // Process current line and return an array of GCode text lines
    _processCurrentLine(reversed) {
        if (this.milling) {
            return this._processMillingLine(reversed)
        }

        return this._processLaserLine(reversed)
    }

    // Process current line and return an array of GCode text lines
    _processMillingLine(reversed) {
        // Skip empty line
        if (! this._trimCurrentLine()) {
            return null
        }

        // Join pixel with same power
        if (this.joinPixel) {
            this._reduceCurrentLine()
        }

        // Mark first and last point on the current line
        this.currentLine[0].first = true
        this.currentLine[this.currentLine.length - 1].last = true

        // Reversed line ?
        if (reversed) {
            this.currentLine = this.currentLine.reverse()
        }

        // Point index
        let point, index = 0

        // Init loop vars...
        let command, gcode = []

        let addCommand = (...args) => {
            command = this._command(...args)
            command && Array.prototype.push.apply(gcode, command)
        }

        // Get first point
        point = this._getPoint(index)

        let plung = false
        let Z, zMax

        let pass = (passNum) => {
            // Move to start of the line
            addCommand(this.generator.moveRapid, ['Z', this.zSafe])
            addCommand(this.generator.moveRapid, ['X', point.X], ['Y', point.Y])
            addCommand(this.generator.moveRapid, ['Z', this.zSurface])

            // For each point on the line
            while (point) {
                if (point.S) {
                    if (plung) {
                        addCommand(this.generator.moveRapid, ['Z', this.zSurface])
                        plung = false
                    }

                    Z    = point.S
                    zMax = this.passDepth * passNum

                    // Last pass
                    if (passNum < this.passes) {
                        Z = Math.max(Z, -zMax)
                    }

                    addCommand(this.generator.moveTool, ['Z', this.zSurface + Z])
                    addCommand(this.generator.moveTool, ['X', point.X], ['Y', point.Y])
                }
                else {
                    if (plung) {
                        addCommand(this.generator.moveTool, ['Z', this.zSurface])
                        plung = false
                    }

                    addCommand(this.generator.moveRapid, ['Z', this.zSafe])
                    addCommand(this.generator.moveRapid, ['X', point.X], ['Y', point.Y])
                }

                if (point.lastWhite || point.lastColored) {
                    plung = true
                }

                // Get next point
                point = this._getPoint(++index)
            }

            // Move to Z safe
            addCommand(this.generator.moveTool, ['Z', this.zSurface])
            addCommand(this.generator.moveRapid, ['Z', this.zSafe])
        }

        for (var i = 1; i <= this.passes; i++) {
            pass(i)

            if (! gcode.length) {
                break
            }

            if (this.gcodes.length < i) {
                this.gcodes.push([])
            }
            else {
                this.gcodes[i - 1].push.apply(this.gcodes[i - 1], gcode)
            }

            index = 0
            gcode = []
            point = this._getPoint(index)

            this.lastCommands = {}
        }

        // Not sure what to return...
        return null
    }

    // Process current line and return an array of GCode text lines
    _processLaserLine(reversed) {
        // Trim trailing white spaces ?
        if (this.trimLine && ! this._trimCurrentLine()) {
            // Skip empty line
            return null
        }

        // Join pixel with same power
        if (this.joinPixel) {
            this._reduceCurrentLine()
        }

        // Overscan ?
        if (this.overscan) {
            this._overscanCurrentLine(reversed)
        }

        // Mark first and last point on the current line
        this.currentLine[0].first = true
        this.currentLine[this.currentLine.length - 1].last = true

        // Reversed line ?
        if (reversed) {
            this.currentLine = this.currentLine.reverse()
        }

        // Point index
        let point, index = 0

        // Init loop vars...
        let command, gcode = []

        let addCommand = (...args) => {
            command = this._command(...args)
            command && Array.prototype.push.apply(gcode, command)
        }

        // Get first point
        point = this._getPoint(index)

        // Move to start of the line

        addCommand(this.G0, ['X', point.X], ['Y', point.Y], ['S', 0])

        // Get next point
        point = this._getPoint(++index)

        // For each point on the line
        while (point) {
            // Burn to next point

            //gcode.push(point.G.call(this.generator, {x: point.X.toFixed(this.precision["X"]), y: point.Y.toFixed(this.precision["Y"]), s:point.S.toFixed(this.precision["S"])}));
            addCommand(point.G, ['X', point.X], ['Y', point.Y], ['S', point.S])

            // Get next point
            point = this._getPoint(++index)
        }

        // Return gcode commands array
        if (gcode.length) {
            return gcode
        }

        // Empty line
        return null
    }

    // Parse horizontally
    _scanHorizontally(nonBlocking) {
        // Init loop vars
        let x = 0, y = 0
        let s, p, point, gcode
        let w = this.size.width
        let h = this.size.height

        let reversed     = false
        let lastWhite    = false
        let firstColored = false
        let lastColored  = false

        let computeCurrentLine = () => {
            // Reset current line
            this.currentLine = []

            // Reset point object
            point = null

            // For each pixel on the line
            for (x = 0; x <= w; x++) {
                // Get pixel power [ 0 = white | 255 = black ]
                s = p = this._getPixelPower(x, y, p)

                // Is this the last white/colored pixel?
                lastWhite    = point && point.p == 0 && p >  0 || !point
                firstColored = point && point.lastWhite
                lastColored  = point && point.p >  0 && p == 0

                // Pixel color from last one on normal line
                if (! reversed && point) {
                    s = point.p
                }

                // Create point object
                point = { x: x, y: y, s: s, p: p }

                // Set last white/colored pixel
                lastWhite    && (point.lastWhite    = true)
                firstColored && (point.firstColored = true)
                lastColored  && (point.lastColored  = true)

                // Add point to current line
                this.currentLine.push(point)
            }
        }

        let percent     = 0
        let lastPercent = 0

        let processCurrentLine = () => {
            // Process pixels line
            gcode = this._processCurrentLine(reversed)

            // Call progress callback
            percent = Math.round((y / h) * 100)

            if (percent > lastPercent) {
                this._onProgress({ gcode, percent })
            }

            lastPercent = percent

            // Skip empty gcode line
            if (! gcode) {
                return
            }

            // Toggle line state
            reversed = ! reversed

            // Concat line
            this.gcode.push.apply(this.gcode, gcode)
        }

        let processNextLine = () => {
            // Aborted ?
            if (! this.running) {
                return this._onAbort()
            }

            // Process line...
            computeCurrentLine()
            processCurrentLine()

            y++

            if (y < h) {
                if (nonBlocking) {
                    setTimeout(processNextLine, 0)
                }
                else {
                    processNextLine()
                }
            }
            else {
                if (this.milling) {
                    this.gcodes.forEach(gcode => {
                        this.gcode.push.apply(this.gcode, gcode)
                    })
                }

                this._onDone({ gcode: this.gcode })
                this.running = false
            }
        }

        processNextLine()
    }

    // Parse vertically
    _scanVertically(nonBlocking) {
        // Init loop vars
        let x = 0, y = 0
        let s, p, point, gcode
        let w = this.size.width
        let h = this.size.height

        let reversed     = false
        let lastWhite    = false
        let firstColored = false
        let lastColored  = false

        let computeCurrentLine = () => {
            // Reset current line
            this.currentLine = []

            // Reset point object
            point = null

            // For each pixel on the line
            for (y = 0; y <= h; y++) {
                // Get pixel power [ 0 = white | 255 = black ]
                s = p = this._getPixelPower(x, y, p)

                // Is this the last white/colored pixel?
                lastWhite    = point && point.p == 0 && p >  0 || !point
                firstColored = point && point.lastWhite
                lastColored  = point && point.p >  0 && p == 0

                // Pixel color from last one on normal line
                if (! reversed && point) {
                    s = point.p
                }

                // Create point object
                point = { x: x, y: y, s: s, p: p }

                // Set last white/colored pixel
                lastWhite    && (point.lastWhite    = true)
                firstColored && (point.firstColored = true)
                lastColored  && (point.lastColored  = true)

                // Add point to current line
                this.currentLine.push(point)
            }
        }

        let percent     = 0
        let lastPercent = 0

        let processCurrentLine = () => {
            // Process pixels line
            gcode = this._processCurrentLine(reversed)

            // Call progress callback
            percent = Math.round((x / h) * 100)

            if (percent > lastPercent) {
                this._onProgress({ gcode, percent })
            }

            lastPercent = percent

            // Skip empty gcode line
            if (! gcode) {
                return
            }

            // Toggle line state
            reversed = ! reversed

            // Concat line
            this.gcode.push.apply(this.gcode, gcode)
        }

        let processNextLine = () => {
            // Aborted ?
            if (! this.running) {
                return this._onAbort()
            }

            // Process line...
            computeCurrentLine()
            processCurrentLine()

            x++

            if (x < w) {
                if (nonBlocking) {
                    setTimeout(processNextLine, 0)
                }
                else {
                    processNextLine()
                }
            }
            else {
                if (this.milling) {
                    this.gcodes.forEach(gcode => {
                        this.gcode.push.apply(this.gcode, gcode)
                    })
                }

                this._onDone({ gcode: this.gcode })
                this.running = false
            }
        }

        processNextLine()
    }

    // Parse diagonally
    _scanDiagonally(nonBlocking) {
        // Init loop vars
        let x = 0, y = 0
        let s, p, point, gcode
        let w = this.size.width
        let h = this.size.height

        let totalLines   = w + h - 1
        let lineNum      = 0
        let reversed     = false
        let lastWhite    = false
        let firstColored = false
        let lastColored  = false

        let computeCurrentLine = (x, y) => {
            // Reset current line
            this.currentLine = []

            // Reset point object
            point = null

            // Increment line num
            lineNum++

            while(true) {
                // Y limit reached !
                if (y < -1 || y == h) {
                    break
                }

                // X limit reached !
                if (x < 0 || x > w) {
                    break
                }

                // Get pixel power [ 0 = white | 255 = black ]
                s = p = this._getPixelPower(x, y, p)

                // Is this the last white/colored pixel?
                lastWhite    = point && point.p == 0 && p >  0 || !point
                firstColored = point && point.lastWhite
                lastColored  = point && point.p >  0 && p == 0

                // Pixel color from last one on normal line
                if (! reversed && point) {
                    s = point.p
                }

                // Create point object
                point = { x: x, y: y, s: s, p: p }

                // Set last white/colored pixel
                lastWhite    && (point.lastWhite    = true)
                firstColored && (point.firstColored = true)
                lastColored  && (point.lastColored  = true)

                // Add point to current line
                this.currentLine.push(point)

                // Next coords
                x++
                y--
            }
        }

        let percent     = 0
        let lastPercent = 0

        let processCurrentLine = () => {
            // Process pixels line
            gcode = this._processCurrentLine(reversed)

            // Call progress callback
            percent = Math.round((lineNum / totalLines) * 100)

            if (percent > lastPercent) {
                this._onProgress({ gcode, percent })
            }

            lastPercent = percent

            // Skip empty gcode line
            if (! gcode) {
                return
            }

            // Toggle line state
            reversed = ! reversed

            // Concat line
            this.gcode.push.apply(this.gcode, gcode)
        }

        let processNextLine = () => {
            // Aborted ?
            if (! this.running) {
                return this._onAbort()
            }

            // Process line...
            //console.log('R: Computing Line: ' + lineNum + ', X= '+ x + ', Y=' + y + ', W= '+ w + ', H=' + h)
            computeCurrentLine(x, y)
            processCurrentLine()

            if (! x) y++
            else x++

            if (y === h) {
                x++
                y--
            }

            if (y < h && x < w) {
                if (nonBlocking) {
                    setTimeout(processNextLine, 0)
                }
                else {
                    processNextLine()
                }
            }
            else {
                this._onDone({ gcode: this.gcode })
                this.running = false
            }
        }

        processNextLine()
    }

    // Parse reverse diagonally
    _scanDiagonallyBack(nonBlocking) {
        // Init loop vars
        let s, p, point, gcode
        let w = this.size.width
        let h = this.size.height
        let x = w, y = 0


        let totalLines   = w + h - 1
        let lineNum      = 0
        let reversed     = false
        let lastWhite    = false
        let firstColored = false
        let lastColored  = false

        let computeCurrentLine = (x, y) => {
            // Reset current line
            this.currentLine = []

            // Reset point object
            point = null

            // Increment line num
            lineNum++

            while(true) {
                // Y limit reached !
                if (y < -1 || y == h) {
                    break
                }

                // X limit reached !
                if (x < 0 || x > w) {
                    break
                }

                // Get pixel power [ 0 = white | 255 = black ]
                s = p = this._getPixelPower(x, y, p)

                // Is this the last white/colored pixel?
                lastWhite    = point && point.p == 0 && p >  0 || !point
                firstColored = point && point.lastWhite
                lastColored  = point && point.p >  0 && p == 0

                // Pixel color from last one on normal line
                if (! reversed && point) {
                    s = point.p
                }

                // Create point object
                point = { x: x, y: y, s: s, p: p }

                // Set last white/colored pixel
                lastWhite    && (point.lastWhite    = true)
                firstColored && (point.firstColored = true)
                lastColored  && (point.lastColored  = true)

                // Add point to current line
                this.currentLine.push(point)

                // Next coords
                x--
                y--
            }
        }

        let percent     = 0
        let lastPercent = 0

        let processCurrentLine = () => {
            // Process pixels line
            gcode = this._processCurrentLine(reversed)

            // Call progress callback
            percent = Math.round((lineNum / totalLines) * 100)

            if (percent > lastPercent) {
                this._onProgress({ gcode, percent })
            }

            lastPercent = percent

            // Skip empty gcode line
            if (! gcode) {
                return
            }

            // Toggle line state
            reversed = ! reversed

            // Concat line
            this.gcode.push.apply(this.gcode, gcode)
        }

        let processNextLine = () => {
            // Aborted ?
            if (! this.running) {
                return this._onAbort()
            }

            // Process line...
            //console.log('R: Computing Line: ' + lineNum + ', X= '+ x + ', Y=' + y + ', W= '+ w + ', H=' + h)
            computeCurrentLine(x, y)
            processCurrentLine()

            if (x === w) y++
            else x--

            if (y === h) {
                x--
                y--
            }

            if (y < h && x > 0) {
                if (nonBlocking) {
                    setTimeout(processNextLine, 0)
                }
                else {
                    processNextLine()
                }
            }
            else {
                this._onDone({ gcode: this.gcode })
                this.running = false
            }
        }

        processNextLine()
    }

    _onProgress(event) {
        //console.log('progress:', event.percent)
    }

    _onDone(event) {
        //console.log('done:', event.gcode.length)
    }

    _onAbort() {
        //console.log('abort')
    }

    on(event, callback, context) {
        let method = '_on' + event[0].toUpperCase() + event.slice(1)

        if (! this[method] || typeof this[method] !== 'function') {
            throw new Error('Undefined event: ' + event)
        }

        this[method] = event => callback.call(context || this, event)

        return this
    }

    // Return the bitmap height-map
    getHeightMap(settings) {
        if (this.running) {
            return
        }

        // Init loop vars
        this.running  = true
        let heightMap = []

        let x = 0
        let y = 0
        let w = this.size.width
        let h = this.size.height

        let percent     = 0
        let lastPercent = 0

        // Defaults settings
        settings = settings || {}

        // Register user callbacks
        this._registerUserCallbacks(settings)

        // Non blocking mode ?
        let nonBlocking = this.nonBlocking

        if (settings.nonBlocking !== undefined) {
            nonBlocking = settings.nonBlocking
        }

        let computeCurrentLine = () => {
            // Reset current line
            let pixels = []

            // For each pixel on the line
            for (x = 0; x < w; x++) {
                pixels.push(this._mapPixelPower(this._getPixelPower(x, y)))
            }

            // Call progress callback
            percent = Math.round((y / h) * 100)

            if (percent > lastPercent) {
                //onProgress.call(settings.progressContext || this, { pixels, percent })
                this._onProgress({ pixels, percent })
            }

            lastPercent = percent

            // Add pixels line
            heightMap.push(pixels)
        }

        let processNextLine = () => {
            // Aborted ?
            if (! this.running) {
                return this._onAbort()
            }

            // Process line...
            computeCurrentLine()

            y++

            if (y < h) {
                if (nonBlocking) {
                    setTimeout(processNextLine, 0)
                }
                else {
                    processNextLine()
                }
            }
            else {
                //onDone.call(settings.doneContext || this, { heightMap })
                this._onDone({ heightMap })
                this.running = false
            }
        }

        processNextLine()

        if (! nonBlocking) {
            return heightMap
        }
    }
}

// Exports
export { RasterToGcode }
export default RasterToGcode
