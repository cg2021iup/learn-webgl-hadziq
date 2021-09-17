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
         0.5, -0.5, 0.56, 0.0,  1.0,        // B - Violet
        -0.5, -0.5,  1.0, 0.0,  0.0,        // A - Red
         0.5,  0.5, 0.54, 0.6, 0.36,        // C - Moss Green
        -0.5,  0.5,  0.5, 0.5,  0.5         // D - Grey
    ];

    // Create a linked-list for storing the vertices data
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // There are two types of shader:
    //  1. Vertex shader: responsible for manipulating vertex position
    //  2. Fragment shader: responsible for manipulating the looks of the vertex (and the fragments between)
    var vsSource = `
        attribute vec2 aPosition;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
            gl_PointSize = 10.0;
            gl_Position = vec4(aPosition, 0.0, 1.0);
            vColor = aColor;
        }
    `;
    var fsSource = `
        precision mediump float;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
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
        2,
        gl.FLOAT,
        false,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.enableVertexAttribArray(aPosition);
    var aColor = gl.getAttribLocation(shaderProgram, "aColor");
    gl.vertexAttribPointer(
        aColor,
        3,
        gl.FLOAT,
        false,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(aColor);

    // Let the computer pick a color from the color pallete to fill the background
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    // Ask the computer to fill the background with the above color
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}