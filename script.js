
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
/** @type {HTMLButtonElement} */
const generateButton = document.getElementById("generate-button");
/** @type {HTMLButtonElement} */
const downloadButton = document.getElementById("download-button");
const ctx = canvas.getContext("2d");

let spacing = 20;
let randomness = 10;
/** @type {Blob} */
let blob;

spacingInput.value = spacing;
randomnessInput.value = randomness;

spacingInput.onchange = () => {
    spacing = spacingInput.value;
}

randomnessInput.onchange = () => {
    randomness = randomnessInput.value;
}

generateButton.onclick = tryReadFile;
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

/** @type {File} */
let file;

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

/**
 * @param {File} file 
 */
function tryReadFile() {
    if (!file) return;
    dropzone.textContent = `${file.name} (${toReadableSize(file.size)})`;
    const reader = new FileReader();
    reader.onload = () => {
        const image = new Image();
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
    ctx.canvas.width = image.naturalWidth;
    ctx.canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);

    generateRandomPoints(image.naturalWidth, image.naturalHeight);
}

/**
 * @param {number} width 
 * @param {number} height 
 */
async function generateRandomPoints(width, height) {
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

            const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
            colors[x][y] = `#${byteToHex(pixel[0])}${byteToHex(pixel[1])}${byteToHex(pixel[2])}`;
        }
    }

    drawTriangles(points, colors, xCount, yCount);
}

/**

* @param {{x:number, y:number}} a 
* @param {{x:number, y:number}} b 
* @param {{x:number, y:number}} c 
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

    ctx.fillStyle = "#000";
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = grd1;
    ctx.fill();
    ctx.fillStyle = grd2;
    ctx.fill();
    ctx.fillStyle = grd3;
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
}

/**
 * @param {{x: number, y: number}[][]} points 
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
        }
    }

    canvas.toBlob(b => {
        if (b) {
            blob = b;
            downloadButton.classList.remove("disabled");
            downloadButton.textContent = `Download Result (${toReadableSize(blob.size)})`;
        }
    });
}

/**
 * @param {number} byte
 */
function byteToHex(byte) {
    return byte.toString(16).padStart(2, "0");
}

/**
 * @param {number} size
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