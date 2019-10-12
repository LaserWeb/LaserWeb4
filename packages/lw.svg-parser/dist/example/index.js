// Debug...
var debug = false;

// Create Parser object
var parser = new SVGParser.Parser();

// Register the onTag callback
parser.onTag(function(tag) {
    log('onTag:', tag);
});

// Load multiple files (sync)
function loadFiles(files) {
    var file = files.shift();

    logStart('open: ' + file.name);

    loadFile(file).then(function() {
        logEnd();
        files.length && loadFiles(files);
    });
}

// Load one file
function loadFile(file) {
    logStart('loading');
    log('file:', file);

    // Load SVG from file
    return parser.loadFromFile(file).then(function(element) {
        log('element:', element);
        logEnd();

        // Parse the file and return a promise
        logStart('parsing');
        return parser.parse().then(function(tags) {
            logEnd();

            logStart('result');
            log('document:', parser.document);
            log('editor:', parser.editor);
            log('tags:', parser.tags);
            logEnd();

            logStart('drawing');
            drawFile(file, tags);
            logEnd();
        });
    })
    .catch(function(error) {
        logEnd();
        console.error('error:', error);
    });

    // Same as above but shorter
    // return parser.parse(file).then(function(tags) {
    //     log('tags:', tags);
    // })
    // .catch(function(error) {
    //     console.error('error:', error);
    // });
}

// Dubug -----------------------------------------------------------------------

function logStart(label) {
    debug && console.groupCollapsed(label);
}

function log() {
    debug && console.log.apply(console, Array.prototype.slice.call(arguments, 0));
}

function logEnd() {
    debug && console.groupEnd();
}

// Draw ------------------------------------------------------------------------

function drawFile(file, tags) {
    // Flip Y coords and move UP by document height
    // (to set origin at bottom/left corners)
    // tags.applyMatrix([1, 0, 0, -1, 0, parser.document.height]);

    // Draw and add the object
    addObject(file.name, drawTag(tags));
}

function flipY(object) {
    object.scale.y = -1;
    object.position.y += parser.document.height;
    object.children.forEach(flipY);
}

function drawTag(tag) {
    // Create 3D object
    var object = new THREE.Object3D();

    // Draw object paths if almost one is present
    if (tag.paths.length && tag.paths[0].length) {
        log('draw:', object, tag);

        tag.getShapes().forEach(function(shape) {
            shape = drawShape(tag, shape)
            object.add(shape);
            flipY(shape)
        });

        tag.getPaths().forEach(function(path) {
            path = drawLine(tag, path)
            object.add(path);
            flipY(path)
        });
    }

    // Draw children
    tag.children.forEach(function(child) {
        object.add(drawTag(child));
    });

    // Return object
    return object;
}

function drawLine(tag, path) {
    log('line:', path);

    var geometry = new THREE.Geometry();
    var material = this.createLineMaterial(tag);

    path.points.forEach(function(point) {
        geometry.vertices.push(new THREE.Vector3(point.x, point.y, 0));
    });

    return new THREE.Line(geometry, material);
}

function createLineMaterial(tag) {
    var opacity  = tag.getAttr('stroke-opacity', 1);
    var material = new THREE.LineBasicMaterial({ color: this.createColor(
        tag.getAttr('stroke', tag.getAttr('fill', 'black'))
    )});

    material.depthWrite = false;
    material.depthTest  = false;

    if (opacity < 1) {
        material.transparent = true;
        material.opacity     = opacity;
    }

    return material;
}

function createSolidMaterial(tag) {
    var opacity  = tag.getAttr('fill-opacity', 1);
    var material = new THREE.MeshBasicMaterial({
        color: this.createColor(tag.getAttr('fill', 'black')),
        side : THREE.DoubleSide
    });

    material.depthWrite = false;
    material.depthTest  = false;

    if (opacity < 1) {
        material.transparent = true;
        material.opacity     = opacity;
    }

    return material;
};

function drawShape(tag, path) {
    log('shape:', path);

    let shape = new THREE.Shape(path.outer.points);

    path.holes.forEach(function(hole) {
        shape.holes.push(new THREE.Path(hole.points));
    });

    var geometry = new THREE.ShapeGeometry(shape);
    var material = createSolidMaterial(tag);

    return new THREE.Mesh(geometry, material);
}

function createColor(color) {
    // TODO ...
    if (color === 'none') {
        color = 'black';
    }

    color = new THREE.Color(color);
    var r = color.r * 255;
    var g = color.g * 255;
    var b = color.b * 255;

    /*// Darken too light colors...
    var luma, lumaLimit = 200;

    while (true) {
    luma = (r * 0.3) + (g * 0.59) + (b * 0.11);

    if (luma <= lumaLimit) {
    break;
}

r > 0 && (r -= 1);
g > 0 && (g -= 1);
b > 0 && (b -= 1);
}*/

// Create color object ([0-255] to [0-1] range)
color = new THREE.Color(r / 255, g / 255, b / 255);

// Return the color object
return color;
}

// UI --------------------------------------------------------------------------

var scene, width, height, renderer, canvas, camera, controls, mesh;

function initViewer() {
    scene    = new THREE.Scene();
    width    = window.innerWidth;
    height   = window.innerHeight;
    renderer = new THREE.WebGLRenderer();
    canvas   = renderer.domElement;
    camera   = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
    controls = new THREE.OrbitControls(camera, canvas);

    renderer.setClearColor(0xffffff, 1);
    renderer.setSize(width, height);

    camera.position.z = 1000;

    controls.enableRotate = true;
    controls.enableZoom   = true;
    controls.enableKeys   = false;

    controls.target.set(0, 0, 0);

    var gridHelper         = new THREE.GridHelper(1000, 10, '#ccc', '#eee');
    gridHelper.rotation.x  = 90 * Math.PI / 180;

    scene.add(gridHelper);

    document.body.appendChild(canvas);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function resize() {
    width  = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function attachBoundingBox(object) {
    var box  = new THREE.Box3().setFromObject(object);
    var bbox = new THREE.BoxHelper(object, 0xff0000);
    object.userData.size = box.getSize();
    object.userData.bbox = bbox;
    bbox.visible = false;
    object.add(bbox);
}

function addObject(name, object) {
    attachBoundingBox(object);
    addUIObject(name, object);
    object.name = name;
    scene.add(object);
}

function removeObject(object) {
    scene.remove(object);
}

function addUIObject(name, object) {
    var file     = $('<li>').attr('id', object.uuid).data('object', object);
    var filename = $('<span></span>').addClass('filename');
    var size     = $('<span></span>').addClass('size');
    var buttons  = $('<span></span>').addClass('buttons');
    var hide     = $('<i class="fa fa-eye" title="Visible"></i>');
    var show     = $('<i class="fa fa-eye-slash" style="display:none;" title="Hidden"></i>');
    var remove   = $('<i class="fa fa-trash"></i>');

    filename.html(name);
    buttons.append(remove, show, hide);
    file.append(buttons, filename);

    $('#files').append(file, size);
    $('#noFiles').hide();

    size.html('size: ' + parseInt(object.userData.size.x) + ' x ' + parseInt(object.userData.size.y) + 'px');
    size.hide();

    file.append(buttons, filename, size);

    file.on('mouseenter', function() {
        object.userData.bbox.visible = true;
        filename.hide();
        size.show();
    })

    file.on('mouseleave', function() {
        object.userData.bbox.visible = false;
        filename.show();
        size.hide();
    })

    remove.on('click', function() {
        removeUIObject(object);
        removeObject(object);
    })

    function toggle() {
        show.toggle();
        hide.toggle();

        object.visible = hide.is(':visible');
    }

    show.on('click', toggle)
    hide.on('click', toggle)
}

function removeUIObject(object) {
    $('#' + object.uuid).remove();
    $('#noFiles').toggle(! $('#files').children().length);
}

$(document).ready(function() {
    // On file input change
    $('#file').on('change', function(event) {
        var files = Array.prototype.slice.call(event.target.files);

        loadFiles(files);
        $(this).val(null);
    });

    // On window resize
    $(window).on('resize', resize)

    // Init viewer
    initViewer();
    animate();
});
