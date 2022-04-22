/** @type {HTMLInputElement} */
const input = document.getElementById("image-input");
/** @type {HTMLDivElement} */
const dropzone = document.querySelector(".dropzone");
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
/** @type {HTMLInputElement} */
const spacingInput = document.getElementById("spacing-input");
/** @type {HTMLInputElement} */
const randomnessInput = document.getElementById("randomness-input");
/** @type {HTMLInputElement} */
const gradientCheckbox = document.getElementById("gradient-checkbox");
/** @type {HTMLButtonElement} */
const generateButton = document.getElementById("generate-button");
/** @type {HTMLButtonElement} */
const downloadButton = document.getElementById("download-button");
/** @type {HTMLParagraphElement} */
const generationTimeText = document.getElementById("generation-time");

const ctx = canvas.getContext("2d");

let spacing = 20;
let randomness = 10;
let useGradient = false;

let generationStartTime = 0;
let generationEndTime = 0;

/** @type {HTMLImageElement} */
let image = null;
/** @type {Blob} */
let blob = null;
/** @type {File} */
let file = null;

/** 
 * @typedef {{ x: number, y: number }} Vector
 */

spacingInput.value = spacing;
randomnessInput.value = randomness;
gradientCheckbox.checked = useGradient;

spacingInput.onchange = () => {
    spacing = Math.max(spacingInput.value, 2);
    spacingInput.value = spacing;
}

randomnessInput.onchange = () => {
    randomness = Math.max(randomnessInput.value, 0);
    randomnessInput.value = randomness;
}

gradientCheckbox.onchange = () => {
    useGradient = gradientCheckbox.checked;
}

generateButton.onclick = () => drawImageToCanvas(image);
downloadButton.onclick = downloadCanvas;

dropzone.onclick = () => input.click();
dropzone.ondragover = (event) => {
    event.preventDefault();
}
dropzone.ondrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    file = event.dataTransfer.items[0]?.getAsFile();
    tryReadFile();
}

input.onchange = (e) => {
    file = e.target.files[0];
    tryReadFile();
}

function downloadCanvas() {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "convert.png";
    link.href = url;
    link.click();
    link.remove();
}

function tryReadFile() {
    if (!file) return;
    dropzone.textContent = `${file.name} (${toReadableSize(file.size)})`;
    const reader = new FileReader();
    reader.onload = () => {
        image = new Image();
        image.onload = () => {
            drawImageToCanvas(image);
        }
        spacingInput.max = Math.min(image.naturalWidth, image.naturalHeight);
        randomnessInput.max = spacingInput.max;
        image.src = reader.result;
    }

    reader.readAsDataURL(file);
}

/**
 * @param {HTMLImageElement} image 
 */
function drawImageToCanvas(image) {
    generationStartTime = (new Date()).getTime();
    ctx.canvas.width = image.naturalWidth;
    ctx.canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);

    generateRandomPoints(image.naturalWidth, image.naturalHeight);
}

/**
 * @param {number} width 
 * @param {number} height 
 */
function generateRandomPoints(width, height) {
    const xCount = Math.ceil(width / spacing);
    const yCount = Math.ceil(height / spacing);

    const points = [];
    const colors = [];
    for (let x = 0; x < xCount; ++x) {
        points[x] = [];
        colors[x] = [];
        for (let y = 0; y < yCount; ++y) {
            const point = {
                x: Math.floor((x * spacing) + (Math.random() - 0.5) * randomness),
                y: Math.floor((y * spacing) + (Math.random() - 0.5) * randomness),
            };
            points[x][y] = point;

            if(useGradient) {
                const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
                colors[x][y] = `#${byteToHex(pixel[0])}${byteToHex(pixel[1])}${byteToHex(pixel[2])}`;
            }
        }
    }

    drawTriangles(points, colors, xCount, yCount);
}

/**
 * @param {Vector} a 
 * @param {Vector} b 
 * @param {Vector} c 
 * @param {string} ac 
 * @param {string} bc 
 * @param {string} cc 
 */
function drawTriangleGradient(a, b, c, ac, bc, cc) {
    const radius = 50;
    const grd1 = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, radius);
    grd1.addColorStop(0, ac + "ff");
    grd1.addColorStop(1, ac + "00");

    const grd2 = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius);
    grd2.addColorStop(0, bc + "ff");
    grd2.addColorStop(1, bc + "00");

    const grd3 = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
    grd3.addColorStop(0, cc + "ff");
    grd3.addColorStop(1, cc + "00");

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();

    ctx.fillStyle = grd1;
    ctx.fill();
    ctx.fillStyle = grd2;
    ctx.fill();
    ctx.fillStyle = grd3;
    ctx.fill();
}

/**
 * @param {Vector} a 
 * @param {Vector} b 
 * @param {Vector} c 
 */
function drawTriangleWithRandomColor(a, b, c) {
    const colorPoints = getRandomPointInsideTriangle(a, b, c);

    const pixel = ctx.getImageData(colorPoints.x, colorPoints.y, 1, 1).data;
    const color = "rgb(" + pixel[0] + "," + pixel[1] + "," + pixel[2] + ")";

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.fill();
}

/**
 * @param {Vector} a 
 * @param {Vector} b 
 * @param {Vector} c 
 * @returns {Vector}
 */
function getRandomPointInsideTriangle(a, b, c) {
    const r1 = Math.random();
    const r2 = Math.random();

    const sqrtR1 = Math.sqrt(r1);

    const x = (1 - sqrtR1) * a.x + (sqrtR1 * (1 - r2)) * b.x + (sqrtR1 * r2) * c.x;
    const y = (1 - sqrtR1) * a.y + (sqrtR1 * (1 - r2)) * b.y + (sqrtR1 * r2) * c.y;

    return { x: Math.floor(x), y: Math.floor(y) };
}

/**
 * @param {Vector[][]} points 
 * @param {string[][]} colors 
 * @param {number} xCount 
 * @param {number} yCount 
 */
function drawTriangles(points, colors, xCount, yCount) {
    for (let x = 0; x < xCount - 1; ++x) {
        for (let y = 0; y < yCount - 1; ++y) {
            const a = points[x][y];
            const b = points[x + 1][y];
            const c = points[x][y + 1];
            const d = points[x + 1][y + 1];

            if(useGradient) {
                const ac = colors[x][y];
                const bc = colors[x + 1][y];
                const cc = colors[x][y + 1];
                const dc = colors[x + 1][y + 1];

                if (Math.random() > 0.5) {
                    drawTriangleGradient(a, b, c, ac, bc, cc);
                    drawTriangleGradient(b, c, d, bc, cc, dc);
                } else {
                    drawTriangleGradient(a, b, d, ac, bc, dc);
                    drawTriangleGradient(a, c, d, ac, cc, dc);
                }
            } else {
                if (Math.random() > 0.5) {
                    drawTriangleWithRandomColor(a, b, c);
                    drawTriangleWithRandomColor(b, c, d);
                } else {
                    drawTriangleWithRandomColor(a, b, d);
                    drawTriangleWithRandomColor(a, c, d);
                }
            }

        }
    }

    canvas.toBlob(b => {
        if (b) {
            blob = b;
            downloadButton.classList.remove("disabled");
            downloadButton.textContent = `Download Result (${toReadableSize(blob.size)})`;
        }
    });

    generationEndTime = (new Date()).getTime();
    generationTimeText.textContent = "Generation: " + (generationEndTime - generationStartTime) + "ms";
}

/**
 * @param {number} byte
 * @return {string}
 */
function byteToHex(byte) {
    return byte.toString(16).padStart(2, "0");
}

/**
 * @param {number} size
 * @return {string}
 */
function toReadableSize(size) {
    if (size < 1024) return size.toFixed(1) + ' B';
    size /= 1024;
    if (size < 1024) return size.toFixed(1) + ' kB';
    size /= 1024;
    if (size < 1024) return size.toFixed(1) + ' MB';
    size /= 1024;
    return size.toFixed(1) + ' GB';
}