/**
 * 3D Tissue Box WebGL Application
 * Creates an interactive 3D tissue box with mouse rotation controls
 */

var canvas;
var gl;
var program;

// Buffer objects
var vBuffer;
var cBuffer;

// Attribute locations
var vPosition;
var vColor;

// Uniform locations
var modelViewMatrixLoc;
var projectionMatrixLoc;

// Transformation matrices
var modelViewMatrix;
var projectionMatrix;

// Rotation angles
var theta = [0, 0, 0];
var axis = 0;

// Mouse interaction variables
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var rotationMatrix = mat4();

// Animation variables
var animationEnabled = true;

// Vertices for a cube (tissue box)
var vertices = [
    // Front face
    vec4(-0.5, -0.5,  0.5, 1.0),
    vec4( 0.5, -0.5,  0.5, 1.0),
    vec4( 0.5,  0.5,  0.5, 1.0),
    vec4(-0.5,  0.5,  0.5, 1.0),
    
    // Back face
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5,  0.5, -0.5, 1.0),
    vec4( 0.5,  0.5, -0.5, 1.0),
    vec4( 0.5, -0.5, -0.5, 1.0),
    
    // Top face
    vec4(-0.5,  0.5, -0.5, 1.0),
    vec4(-0.5,  0.5,  0.5, 1.0),
    vec4( 0.5,  0.5,  0.5, 1.0),
    vec4( 0.5,  0.5, -0.5, 1.0),
    
    // Bottom face
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4( 0.5, -0.5, -0.5, 1.0),
    vec4( 0.5, -0.5,  0.5, 1.0),
    vec4(-0.5, -0.5,  0.5, 1.0),
    
    // Right face
    vec4( 0.5, -0.5, -0.5, 1.0),
    vec4( 0.5,  0.5, -0.5, 1.0),
    vec4( 0.5,  0.5,  0.5, 1.0),
    vec4( 0.5, -0.5,  0.5, 1.0),
    
    // Left face
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, -0.5,  0.5, 1.0),
    vec4(-0.5,  0.5,  0.5, 1.0),
    vec4(-0.5,  0.5, -0.5, 1.0)
];

// Colors for each face of the tissue box
var vertexColors = [
    // Front face (Red)
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    
    // Back face (Green)
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    
    // Top face (Magenta)
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    
    // Bottom face (Cyan)
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    
    // Right face (Yellow)
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    
    // Left face (Blue)
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(0.0, 0.0, 1.0, 1.0)   // blue
];

// Indices for drawing triangles (2 triangles per face)
var indices = [
    // Front face
    0, 1, 2,    0, 2, 3,
    // Back face
    4, 5, 6,    4, 6, 7,
    // Top face
    8, 9, 10,   8, 10, 11,
    // Bottom face
    12, 13, 14, 12, 14, 15,
    // Right face
    16, 17, 18, 16, 18, 19,
    // Left face
    20, 21, 22, 20, 22, 23
];

window.onload = function init() {
    // Get canvas and WebGL context
    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Enable depth testing and face culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Load and initialize shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create and bind vertex buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Create and bind color buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Create index buffer
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Get uniform locations
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Set up projection matrix (perspective)
    projectionMatrix = perspective(45.0, canvas.width/canvas.height, 0.1, 10.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Set up mouse event listeners
    setupMouseHandlers();

    // Start the rendering loop
    render();
}

function setupMouseHandlers() {
    canvas.addEventListener('mousedown', function(event) {
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });

    canvas.addEventListener('mouseup', function(event) {
        mouseDown = false;
    });

    canvas.addEventListener('mousemove', function(event) {
        if (!mouseDown) {
            return;
        }

        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;

        // Convert mouse movement to rotation
        var rotateX = deltaY * 0.5;
        var rotateY = deltaX * 0.5;

        // Create rotation matrices for X and Y axes
        var rotX = rotate(rotateX, [1, 0, 0]);
        var rotY = rotate(rotateY, [0, 1, 0]);

        // Combine rotations
        rotationMatrix = mult(rotY, mult(rotX, rotationMatrix));

        lastMouseX = newX;
        lastMouseY = newY;
    });

    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });
}

function render() {
    // Clear the color and depth buffers
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up the model-view matrix
    var eye = vec3(0, 0, 3);  // Camera position
    var at = vec3(0, 0, 0);   // Look at point
    var up = vec3(0, 1, 0);   // Up vector

    modelViewMatrix = lookAt(eye, at, up);
    
    // Apply rotation from mouse interaction
    modelViewMatrix = mult(modelViewMatrix, rotationMatrix);
    
    // Add small continuous rotation for animation when not dragging
    if (!mouseDown && animationEnabled) {
        theta[1] += 0.5;  // Auto-rotate around Y axis
        var autoRotation = rotate(theta[1], [0, 1, 0]);
        modelViewMatrix = mult(modelViewMatrix, autoRotation);
    }

    // Send the model-view matrix to the shader
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the tissue box using indexed drawing
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    // Request next frame
    requestAnimationFrame(render);
}

// Fallback for WebGLUtils if not available
if (typeof WebGLUtils === 'undefined') {
    window.WebGLUtils = {
        setupWebGL: function(canvas) {
            return canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        }
    };
}