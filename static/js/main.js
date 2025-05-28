const socket = io();
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');

// Set logical canvas size (CSS dimensions)
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 2000;
canvas.style.width = `${CANVAS_WIDTH}px`;
canvas.style.height = `${CANVAS_HEIGHT}px`;

// Set actual canvas pixel size (high DPI support)
const dpr = window.devicePixelRatio || 1;
canvas.width = CANVAS_WIDTH * dpr;
canvas.height = CANVAS_HEIGHT * dpr;

// Scale context for clarity
ctx.scale(dpr, dpr);

let drawing = false;
let lastX = 0;
let lastY = 0;

// Enable toolbar only for main user
if (role === 'main') {
    document.getElementById('toolbar').style.display = 'block';
}

function getScaledCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
        const touch = e.touches[0];
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    } else {
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
}

function drawLine(x0, y0, x1, y1, color = 'black', size = 2, emit = true) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 / dpr, y0 / dpr);
    ctx.lineTo(x1 / dpr, y1 / dpr);
    ctx.stroke();
    ctx.closePath();

    if (!emit || role !== 'main') return;
    socket.emit('draw', { x0, y0, x1, y1, color, size });
}

if (role === 'main') {
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const { x, y } = getScaledCoords(e);
        lastX = x;
        lastY = y;
        drawing = true;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!drawing) return;
        const { x, y } = getScaledCoords(e);
        const color = colorPicker.value;
        const size = brushSize.value;
        drawLine(lastX, lastY, x, y, color, size);
        lastX = x;
        lastY = y;
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        drawing = false;
    });

    canvas.addEventListener('mousedown', (e) => {
        const { x, y } = getScaledCoords(e);
        lastX = x;
        lastY = y;
        drawing = true;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const { x, y } = getScaledCoords(e);
        const color = colorPicker.value;
        const size = brushSize.value;
        drawLine(lastX, lastY, x, y, color, size);
        lastX = x;
        lastY = y;
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
    });

    // Handle clear button
    clearBtn.addEventListener('click', () => {
        clearCanvas();
        socket.emit('clear');
    });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Receive drawing data from server
socket.on('draw', (data) => {
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
});

// Receive clear signal
socket.on('clear', () => {
    clearCanvas();
});

// Save full canvas as PDF
document.getElementById('savePDF').addEventListener('click', () => {
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [CANVAS_WIDTH, CANVAS_HEIGHT]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pdf.save('whiteboard.pdf');
});

// Prevent page scrolling when drawing on main
document.body.addEventListener('touchmove', function (e) {
    if (role === 'main') e.preventDefault();
}, { passive: false });
