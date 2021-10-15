function main() {
    // Access to the canvas through DOM: Document Object Model
    var canvas1 = document.getElementById('canvas1');   // Prepare the paper
    var gl = canvas1.getContext("webgl"); // Prepare the drawing tools: the brush, the paint, the pallete
    // .getContext("webgl") will give us access to WebGL API

    // Define vertices data
    /**
     * A ( -0.5, -0.5 )
     * B (  0.5, -0.5 )
     * C (  0.5,  0.5 )
     * D ( -0.5,  0.5 )
     */

    var vertices = [
        -0.5, -0.5, 0.0,  1.0, 0.0,  0.0,        // A - Red
         0.5, -0.5, 0.0, 0.56, 0.0,  1.0,        // B - Violet
         0.5,  0.5, 0.0, 0.54, 0.6, 0.36,        // C - Moss Green
        -0.5, -0.5, 0.0,  1.0, 0.0,  0.0,        // A - Red
         0.5,  0.5, 0.0, 0.54, 0.6, 0.36,        // C - Moss Green
        -0.5,  0.5, 0.0,  0.5, 0.5,  0.5         // D - Grey
    ];

    // Create a linked-list for storing the vertices data
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // There are two types of shader:
    //  1. Vertex shader: responsible for manipulating vertex position
    //  2. Fragment shader: responsible for manipulating the looks of the vertex (and the fragments between)
    var vsSource = `
        attribute vec3 aPosition;
        attribute vec3 aColor;
        varying vec3 vColor;
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;
        void main() {
            // POSTMULTIPLICATION MATRIX FOR TRANSFORMATION
            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.);
            vColor = aColor;
        }
    `;
    var fsSource = `
        precision mediump float;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, 1.);
        }
    `

    // Create .c in GPU
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);   // Result in an empty vertexShader.c file
    gl.shaderSource(vertexShader, vsSource);    // Fill the vertexShader.c file with the strings of code
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);   // Result in an empty fragmentShader.c file
    gl.shaderSource(fragmentShader, fsSource);  // Fill the fragmentShader.c file with the strings of code

    // Compile .c into .o
    gl.compileShader(vertexShader); // Result in vertexShader.o
    gl.compileShader(fragmentShader);   // Result in fragmentShader.o

    // Prepare "the bowl" for the program: .exe
    var shaderProgram = gl.createProgram();

    // Put "the ingredients", vertexShader and fragmentShader, into "the bowl"
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    // Let's mix it: Link the two .o files
    gl.linkProgram(shaderProgram);  // The drawing tools are ready,
                                    //  but our computer has not yet
                                    //  held the drawing tools in its hands.
    
    // Let the computer hold the drawing tools
    gl.useProgram(shaderProgram);

    // Teach the computer how to collect
    //  the positional values from ARRAY_BUFFER
    //  to each vertex being processed
    var aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.vertexAttribPointer(
        aPosition,
        3,
        gl.FLOAT,
        false,
        6 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.enableVertexAttribArray(aPosition);
    var aColor = gl.getAttribLocation(shaderProgram, "aColor");
    gl.vertexAttribPointer(
        aColor,
        3,
        gl.FLOAT,
        false,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(aColor);

    // Connect matrices for transformation
    var uModel = gl.getUniformLocation(shaderProgram, "uModel");
    var uView = gl.getUniformLocation(shaderProgram, "uView");
    var uProjection = gl.getUniformLocation(shaderProgram, "uProjection");

    // Init matrices for transformation
    var view = glMatrix.mat4.create();
    var projection = glMatrix.mat4.create();

    // Define the view matrix
    var camera = [0.0, 0.0, 2.0];
    glMatrix.mat4.lookAt(
        view,
        camera, // position of the eye or the camera or the viewer
        [0.0, 0.0, 0.0], // point where the camera looking at
        [0.0, 1.0, 0.0]
    );
    gl.uniformMatrix4fv(uView, false, view);

    // Define the perspective projection matrix
    glMatrix.mat4.perspective(
        projection,
        Math.PI / 3, // field of view (about y axis)
        1, // ratio aspect
        0.5,
        10.0
    );
    gl.uniformMatrix4fv(uProjection, false, projection);

    // Create a pointer to the Uniform variable we have on the shader
    var delta = [0.0, 0.0, 0.0]; // For tha changes about the x, y, and z axes
    var deltaX = 0.003;
    var deltaY = 0.005;
    var angle = 0;
    var animating = true;

    // Create an interactive graphics using mouse
    function onMouseClick(event) {
        animating = !animating;
    }
    document.addEventListener("click", onMouseClick);

    // Create an interactive graphics using keyboard
    function onKeydown(event) {
        if (event.keyCode == 32) animating = false;
        if (event.keyCode == 37) camera[0] -= 0.1; // Left
        if (event.keyCode == 38) camera[1] += 0.1; // Up
        if (event.keyCode == 39) camera[0] += 0.1; // Right
        if (event.keyCode == 40) camera[1] -= 0.1; // Down
        glMatrix.mat4.lookAt(
            view,
            camera, // position of the eye or the camera or the viewer
            [0.0, 0.0, 0.0], // point where the camera looking at
            [0.0, 1.0, 0.0]
        );
        gl.uniformMatrix4fv(uView, false, view);
    }
    function onKeyup(event) {
        if (event.keyCode == 32) animating = true;
    }
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("keyup", onKeyup);

    // Create an interactive graphics using gamepad
    window.addEventListener('gamepadconnected', (event) => {
        var update = () => {
            for (var gamepad of navigator.getGamepads()) {
                if (!gamepad) continue;
                for (var [index, button] of gamepad.buttons.entries()) {
                    if (index == 8 && button.value == true) animating = false;
                    else if (index == 8 && button.value == false) animating = true;
                }
                requestAnimationFrame(update);
            };
        }
        update();
    });

    function render() {
        if (animating) {
            // Build a linear animation
            if (delta[0] >= 0.5 || delta[0] <= -0.5) deltaX = -deltaX;
            if (delta[1] >= 0.5 || delta[1] <= -0.5) deltaY = -deltaY;
            delta[0] += deltaX;
            delta[1] += deltaY;
            angle += 0.01;
            // Init the model matrix to avoid gradual animation
            var model = glMatrix.mat4.create();
            // Define dilation matrix
            //glMatrix.mat4.scale(model, model, delta);
            // Define rotation matrix
            //glMatrix.mat4.rotate(model, model, angle, [1, 0, 0]); // about x axis
            //glMatrix.mat4.rotate(model, model, angle, [0, 1, 0]); // about y axis
            //glMatrix.mat4.rotate(model, model, angle, [0, 0, 1]); // about z axis
            // Define translation matrix
            glMatrix.mat4.translate(model, model, delta);
            // Transfer the model matrix values to the shader
            gl.uniformMatrix4fv(uModel, false, model);
        }

        // Let the computer pick a color from the color pallete to fill the background
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        // Ask the computer to fill the background with the above color
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    render();
}