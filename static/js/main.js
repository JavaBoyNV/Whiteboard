const socket = io();
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let lastX = 0;
let lastY = 0;

// Enable toolbar only for main user
if (role === 'main') {
    document.getElementById('toolbar').style.display = 'block';
}

function drawLine(x0, y0, x1, y1, color='black', size=2, emit=true) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (!emit || role !== 'main') return;
    socket.emit('draw', { x0, y0, x1, y1, color, size });
}

if (role === 'main') {

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
        drawing = true;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling
        if (!drawing) return;

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const color = colorPicker.value;
        const size = brushSize.value;
        drawLine(lastX, lastY, x, y, color, size);

        lastX = x;
        lastY = y;
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault(); // Prevent scrolling
        drawing = false;
    });

    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const x = e.clientX;
        const y = e.clientY;
        const color = colorPicker.value;
        const size = brushSize.value;
        drawLine(lastX, lastY, x, y, color, size);
        lastX = x;
        lastY = y;
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

document.getElementById('savePDF').addEventListener('click', () => {
    const canvas = document.getElementById('whiteboard');
    const imgData = canvas.toDataURL('image/png');

    // Use jsPDF from the global window object
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('whiteboard.pdf');
});

document.body.addEventListener('touchmove', function(e) {
    if (role === 'main') e.preventDefault();
}, { passive: false });