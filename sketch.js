
let t;
let theta;
const maxFrameCount = 75;

const a = 101; // offset number
const space = 200; // doubled the size of cube for for loops (was 100)

let c1, c2;
let rotationX = 45;
let rotationY = 145;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationSpeed = 2;
let zoomLevel = 1;

let colorSchemes = [
    { c1: [240, 40, 100], c2: [40, 40, 90] },      // original
    { c1: [60, 255, 150], c2: [20, 100, 255] },    // neon
    { c1: [255, 180, 0], c2: [128, 0, 128] },      // purple-orange
    { c1: [0, 255, 255], c2: [255, 0, 128] },      // cyan-pink
    { c1: [255, 87, 51], c2: [51, 105, 255] },     // complementary: coral-royal blue
    { c1: [255, 191, 0], c2: [138, 43, 226] },     // golden-purple
    { c1: [50, 205, 50], c2: [255, 105, 180] },    // lime green-hot pink
    { c1: [255, 140, 0], c2: [0, 191, 255] },      // dark orange-deep sky blue
    { c1: [147, 112, 219], c2: [255, 215, 0] },    // medium purple-gold
    { c1: [0, 206, 209], c2: [255, 69, 0] },       // turquoise-red orange
    { c1: [218, 112, 214], c2: [154, 205, 50] },   // orchid-yellow green
    { c1: [255, 20, 147], c2: [32, 178, 170] }     // deep pink-light sea green
];
let currentScheme = 0;

let sound;
let fft;
let spectrum;
let audioPlaying = false;
let shapes = ['box', 'sphere', 'torus', 'cylinder', 'cone', 'octahedron', 'torusKnot'];
let currentShape = 0;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    updateColors();
    
    // Setup audio analysis
    fft = new p5.FFT();
    
    // Initialize mouse position
    previousMouseX = mouseX;
    previousMouseY = mouseY;
    
    // Setup audio file upload handler
    const audioInput = document.getElementById('audio-upload');
    audioInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        
        if (sound && sound.isPlaying()) {
            sound.stop();
        }
        
        sound = loadSound(url, () => {
            sound.play();
            audioPlaying = true;
        });
    });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
    if (mouseButton === RIGHT) {
        currentScheme = (currentScheme + 1) % colorSchemes.length;
        updateColors();
    } else {
        isDragging = true;
        previousMouseX = mouseX;
        previousMouseY = mouseY;
    }
}

function mouseReleased() {
    isDragging = false;
}

function mouseDragged() {
    if (isDragging) {
        const deltaX = mouseX - previousMouseX;
        const deltaY = mouseY - previousMouseY;
        rotationY += deltaX * 0.5;
        rotationX += deltaY * 0.5;
        previousMouseX = mouseX;
        previousMouseY = mouseY;
    }
}

function mouseWheel(event) {
    zoomLevel = constrain(zoomLevel + event.delta * 0.001, 0.5, 3);
    return false;
}

function keyPressed() {
    switch (key.toLowerCase()) {
        case 'w': rotationX -= rotationSpeed; break;
        case 's': rotationX += rotationSpeed; break;
        case 'a': rotationY -= rotationSpeed; break;
        case 'd': rotationY += rotationSpeed; break;
        case 'c': 
            currentScheme = (currentScheme + 1) % colorSchemes.length;
            updateColors();
            break;
        case 'b':
            currentShape = (currentShape + 1) % shapes.length;
            break;
    }
}

function updateColors() {
    const scheme = colorSchemes[currentScheme];
    c1 = color(...scheme.c1);
    c2 = color(...scheme.c2);
}

function draw() {
    background(5);
    t = frameCount / maxFrameCount;
    theta = TWO_PI * t;

    // Update audio analysis
    if (audioPlaying) {
        spectrum = fft.analyze();
    }

    // lights
    directionalLight(245, 245, 245, 300, -200, -200);
    ambientLight(240, 240, 240);

    // Apply zoom
    scale(zoomLevel);

    // rotate the whole cube
    rotateY(radians(rotationY + (audioPlaying ? map(fft.getEnergy("mid"), 0, 255, 0, 45) : 0)));
    rotateX(radians(rotationX + (audioPlaying ? map(fft.getEnergy("treble"), 0, 255, 0, 45) : 0)));

    // 3 nested for loops to create sides
    for (let x = -space; x <= space; x += 40) { 
        for (let y = -space; y <= space; y += 40) { 
            for (let z = -space; z <= space; z += 400) { 
                // map size of small cubes with offset and audio reactivity
                const offSet = ((x * y * z)) / a;
                let sz = map(sin(-theta + offSet), -1, 1, 0, 40);
                
                if (audioPlaying) {
                    const freqIndex = floor(map(abs(x * y * z), 0, space * space * space, 0, spectrum.length-1));
                    const audioScale = map(spectrum[freqIndex], 0, 255, 0.5, 2);
                    sz *= audioScale;
                } 

                if ((x * y * z) % 30 === 0) {
                    fill(c1);
                    stroke(c2);
                } else {
                    fill(c2);
                    stroke(c1);
                }

                // small blocks, 3 times to create cube
                shp(x, y, z, sz);
                shp(y, z, x, sz);
                shp(z, x, y, sz);
            }
        }
    }
}

function shp(x, y, z, d) {
    push();
    translate(x, y, z);
    switch(shapes[currentShape]) {
        case 'sphere':
            sphere(d/2);
            break;
        case 'torus':
            torus(d/2, d/4);
            break;
        case 'cylinder':
            cylinder(d/2, d);
            break;
        case 'cone':
            cone(d/2, d);
            break;
        case 'octahedron':
            rotateX(frameCount * 0.01);
            rotateY(frameCount * 0.01);
            beginShape();
            // Top vertex
            vertex(0, -d/2, 0);
            // Middle vertices
            vertex(d/2, 0, d/2);
            vertex(-d/2, 0, d/2);
            vertex(-d/2, 0, -d/2);
            vertex(d/2, 0, -d/2);
            // Bottom vertex
            vertex(0, d/2, 0);
            endShape(CLOSE);
            break;
        case 'torusKnot':
            push();
            rotateX(frameCount * 0.02);
            rotateY(frameCount * 0.02);
            const detail = 64;
            const p = 2;
            const q = 3;
            beginShape(TRIANGLE_STRIP);
            for (let i = 0; i <= detail; i++) {
                const t = i * TWO_PI / detail;
                const r = d/2 * (2 + cos(q*t));
                const x = r * cos(p*t);
                const y = r * sin(p*t);
                const z = d/2 * sin(q*t);
                vertex(x, y, z);
                vertex(x*0.8, y*0.8, z*0.8);
            }
            endShape();
            pop();
            break;
        default:
            box(d);
    }
    pop();
}

