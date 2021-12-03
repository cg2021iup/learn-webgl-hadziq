function main() {
    // Access to the canvas through DOM: Document Object Model
    var canvas1 = document.getElementById('canvas1');   // Prepare the paper
    var gl = canvas1.getContext("webgl"); // Prepare the drawing tools: the brush, the paint, the pallete
    // .getContext("webgl") will give us access to WebGL API

    // For texture
    var texture, uTextureSampler;
    function initTextures(callback) {
        texture = gl.createTexture();
        var image = new Image();
        image.onload = function() { loadTexture(image, callback); }
        image.src = "txCrate.bmp";
    }
    function loadTexture(image, callback) {
        // Flip the image's y axis
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        // Bind the texture object to the target on GPU
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Set the texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // Set the texture image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        callback();
    }

    // Define vertices data of the cube
    var vertices = [
        // Face A       // Tex      // Surface orientation (normal vector)
        -1, -1, -1,     0, 0,     0, 0, -1,   // Index:  0    
         1, -1, -1,     1, 0,     0, 0, -1,   // Index:  1
         1,  1, -1,     1, 1,     0, 0, -1,   // Index:  2
        -1,  1, -1,     0, 1,     0, 0, -1,   // Index:  3
        // Face B       
        -1, -1,  1,     0, 0,     0, 0, 1,    // Index:  4
         1, -1,  1,     1, 0,     0, 0, 1,    // Index:  5
         1,  1,  1,     1, 1,     0, 0, 1,    // Index:  6
        -1,  1,  1,     0, 1,     0, 0, 1,    // Index:  7
        // Face C       
        -1, -1, -1,     0, 0,     -1, 0, 0,   // Index:  8
        -1,  1, -1,     1, 0,     -1, 0, 0,   // Index:  9
        -1,  1,  1,     1, 1,     -1, 0, 0,   // Index: 10
        -1, -1,  1,     0, 1,     -1, 0, 0,   // Index: 11
        // Face D       
         1, -1, -1,     0, 0,     1, 0, 0,    // Index: 12
         1,  1, -1,     1, 0,     1, 0, 0,    // Index: 13
         1,  1,  1,     1, 1,     1, 0, 0,    // Index: 14
         1, -1,  1,     0, 1,     1, 0, 0,    // Index: 15
        // Face E       
        -1, -1, -1,     0, 0,     0, -1, 0,   // Index: 16
        -1, -1,  1,     0, 1,     0, -1, 0,   // Index: 17
         1, -1,  1,     1, 1,     0, -1, 0,   // Index: 18
         1, -1, -1,     1, 0,     0, -1, 0,   // Index: 19
        // Face F       
        -1,  1, -1,     0, 0,     0, 1, 0,    // Index: 20
        -1,  1,  1,     0, 1,     0, 1, 0,    // Index: 21
         1,  1,  1,     1, 1,     0, 1, 0,    // Index: 22
         1,  1, -1,     1, 0,     0, 1, 0     // Index: 23
    ];

    var indices = [
        0, 1, 2,     0, 2, 3,     // Face A
        4, 5, 6,     4, 6, 7,     // Face B
        8, 9, 10,    8, 10, 11,   // Face C
        12, 13, 14,  12, 14, 15,  // Face D
        16, 17, 18,  16, 18, 19,  // Face E
        20, 21, 22,  20, 22, 23,  // Face F     
    ];

    // Create a linked-list for storing the vertices data
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // There are two types of shader:
    //  1. Vertex shader: responsible for manipulating vertex position
    //  2. Fragment shader: responsible for manipulating the looks of the vertex (and the fragments between)
    var vsSource = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;
        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;
        void main() {
            // POSTMULTIPLICATION MATRIX FOR TRANSFORMATION
            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.);
            vTexCoord = aTexCoord;
            vNormal = aNormal;
            vPosition = (uModel * vec4(aPosition, 1.)).xyz;
        }
    `;
    var fsSource = `
        precision mediump float;
        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 uLightConstant;      // It represents the light color (r, g, b)
        uniform float uAmbientIntensity;    // It is between 0. and 1.
        uniform vec3 uLight;
        uniform mat3 uNormalModel;
        uniform vec3 uViewer;
        uniform sampler2D uTextureSampler;
        void main() {
            vec3 ambient = uLightConstant * uAmbientIntensity;
            // vec3 normalizedLight = normalize(uLight);   // [3.0, 0.0, 0.0] --> [1.0, 0.0, 0.0]
            vec3 normalizedLight = normalize(uLight - vPosition);
            vec3 normalizedNormal = normalize(uNormalModel * vNormal);
            float cosTheta = dot(normalizedLight, normalizedNormal);
            vec3 diffuse = vec3(0.0, 0.0, 0.0);
            if (cosTheta > 0.0) {
                diffuse = uLightConstant * cosTheta;
            }
            vec3 specular = vec3(0.0, 0.0, 0.0);
            float shininessConstant = 300.0;
            //vec3 normalizedReflector = 2.0 * dot(normalizedLight, normalizedNormal) * (uNormalModel * vNormal) - (uLight - vPosition);
            vec3 normalizedReflector = normalize(reflect(-uLight, normalizedNormal));
            vec3 normalizedViewer = normalize(uViewer - vPosition);
            float cosPhi = dot(normalizedReflector, normalizedViewer);
            if (cosPhi > 0.0) {
                specular = uLightConstant * pow(cosPhi, shininessConstant);
            }
            vec3 phong = ambient + diffuse + specular;
            vec4 textureColor = texture2D(uTextureSampler, vTexCoord);
            gl_FragColor = vec4(phong, 1.) * textureColor;
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
        8 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.enableVertexAttribArray(aPosition);
    var aTexCoord = gl.getAttribLocation(shaderProgram, "aTexCoord");
    gl.vertexAttribPointer(
        aTexCoord,
        2,
        gl.FLOAT,
        false,
        8 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(aTexCoord);
    var aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
    gl.vertexAttribPointer(
        aNormal,
        3,
        gl.FLOAT,
        false,
        8 * Float32Array.BYTES_PER_ELEMENT,
        5 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(aNormal);

    // Connect matrices for transformation
    var uModel = gl.getUniformLocation(shaderProgram, "uModel");
    var uView = gl.getUniformLocation(shaderProgram, "uView");
    var uProjection = gl.getUniformLocation(shaderProgram, "uProjection");

    // Init matrices for transformation
    var view = glMatrix.mat4.create();
    var projection = glMatrix.mat4.create();

    // Define the view matrix
    var camera = [0.0, 0.0, 4.0];
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

    // Define the lighting and shading
    var uLightConstant = gl.getUniformLocation(shaderProgram, "uLightConstant");
    var uAmbientIntensity = gl.getUniformLocation(shaderProgram, "uAmbientIntensity");
    gl.uniform3fv(uLightConstant, [1.0, 1.0, 1.0]);    // White light
    gl.uniform1f(uAmbientIntensity, 0.4);   // 40% light intensity
    var uLight = gl.getUniformLocation(shaderProgram, "uLight");
    // gl.uniform3fv(uLight, [3.0, 0.0, 0.0]); // Rightward light reflection (i.e., light comes from the right side)
    gl.uniform3fv(uLight, [-1.5, 1.5, 1.5]);    // Point light located on top right front
    var uNormalModel = gl.getUniformLocation(shaderProgram, "uNormalModel");
    var uViewer = gl.getUniformLocation(shaderProgram, "uViewer");
    gl.uniform3fv(uViewer, camera);

    // Create an interactive graphics using mouse
    var mouseIsDown = false;
    var lastPointOnTrackBall, currentPointOnTrackBall;
    var lastQuat = glMatrix.quat.create();
    var rotation = glMatrix.mat4.create();
    function onMouseDown(event) {
        var x = event.clientX;
        var y = event.clientY;
        var rect = event.target.getBoundingClientRect();
        // When the mouse pointer is inside the target area
        if (
            rect.left <= x &&
            rect.right >= x &&
            rect.top <= y &&
            rect.bottom >= y
        ) {
            mouseIsDown = true;
            currentPointOnTrackBall = getProjectionPointOnSurface([x, y, 0.0]);
            lastPointOnTrackBall = currentPointOnTrackBall;
        }
    }
    function onMouseUp(event) {
        mouseIsDown = false;
        if (currentPointOnTrackBall != lastPointOnTrackBall) {
            lastQuat = computeCurrentQuat();
        }
    }
    function onMouseMove(event) {
        if (mouseIsDown) {
            var x = event.clientX;
            var y = event.clientY;
            currentPointOnTrackBall = getProjectionPointOnSurface([x, y, 0.0]);
            glMatrix.mat4.fromQuat(rotation, computeCurrentQuat());
        }
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    function computeCurrentQuat() {
        // Secara berkala hitung quaternion rotasi setiap ada perubahan posisi titik pointer mouse
        var axisFromCrossProduct = glMatrix.vec3.cross(glMatrix.vec3.create(), lastPointOnTrackBall, currentPointOnTrackBall);
        var angleFromDotProduct = Math.acos(glMatrix.vec3.dot(lastPointOnTrackBall, currentPointOnTrackBall));
        var rotationQuat = glMatrix.quat.setAxisAngle(glMatrix.quat.create(), axisFromCrossProduct, angleFromDotProduct);
        glMatrix.quat.normalize(rotationQuat, rotationQuat);
        return glMatrix.quat.multiply(glMatrix.quat.create(), rotationQuat, lastQuat);
    }
    // Memproyeksikan pointer mouse agar jatuh ke permukaan ke virtual trackball
    function getProjectionPointOnSurface(point) {
        var radius = canvas1.width/3;  // Jari-jari virtual trackball kita tentukan sebesar 1/3 lebar kanvas
        var center = glMatrix.vec3.fromValues(canvas1.width/2, canvas1.height/2, 0);  // Titik tengah virtual trackball
        var pointVector = glMatrix.vec3.subtract(glMatrix.vec3.create(), point, center);
        pointVector[1] = pointVector[1] * (-1); // Flip nilai y, karena koordinat piksel makin ke bawah makin besar
        var radius2 = radius * radius;
        var length2 = pointVector[0] * pointVector[0] + pointVector[1] * pointVector[1];
        if (length2 <= radius2) pointVector[2] = Math.sqrt(radius2 - length2); // Dapatkan nilai z melalui rumus Pytagoras
        else {  // Atur nilai z sebagai 0, lalu x dan y sebagai paduan Pytagoras yang membentuk sisi miring sepanjang radius
            pointVector[0] *= radius / Math.sqrt(length2);
            pointVector[1] *= radius / Math.sqrt(length2);
            pointVector[2] = 0;
        }
        return glMatrix.vec3.normalize(glMatrix.vec3.create(), pointVector);
    }

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
        gl.uniform3fv(uViewer, camera);
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
        // Init the model matrix to avoid gradual animation
        var model = glMatrix.mat4.create();
        glMatrix.mat4.multiply(model, model, rotation);
        // Transfer the model matrix values to the shader
        gl.uniformMatrix4fv(uModel, false, model);
        // Copy transformation from vertex model matrix to normal vector model matrix
        var normalModel = glMatrix.mat3.create();
        glMatrix.mat3.normalFromMat4(normalModel, model);
        gl.uniformMatrix3fv(uNormalModel, false, normalModel);
        // Activate texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        uTextureSampler = gl.getUniformLocation(shaderProgram, "uTextureSampler");
        gl.uniform1i(uTextureSampler, 0);
        gl.enable(gl.DEPTH_TEST);
        // Let the computer pick a color from the color pallete to fill the background
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        // Ask the computer to fill the background with the above color
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    }
    initTextures(render);
}