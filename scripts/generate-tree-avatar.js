const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a 512x512 canvas
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Clear canvas with white background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 512, 512);

// Draw background circle
ctx.beginPath();
ctx.arc(256, 256, 240, 0, Math.PI * 2);
ctx.fillStyle = '#e6f7ff';
ctx.fill();
ctx.strokeStyle = '#91d5ff';
ctx.lineWidth = 4;
ctx.stroke();

// Draw tree trunk
ctx.fillStyle = '#8b4513';
ctx.fillRect(216, 300, 80, 140);

// Add trunk highlight
ctx.fillStyle = '#a0522d';
ctx.fillRect(236, 300, 30, 140);

// Draw tree leaves using triangular shape (bottom layer)
ctx.beginPath();
ctx.moveTo(256, 80);
ctx.lineTo(100, 320);
ctx.lineTo(412, 320);
ctx.closePath();
ctx.fillStyle = '#228b22';
ctx.fill();

// Draw middle layer of leaves
ctx.beginPath();
ctx.moveTo(256, 120);
ctx.lineTo(140, 280);
ctx.lineTo(372, 280);
ctx.closePath();
ctx.fillStyle = '#32cd32';
ctx.fill();

// Draw top layer of leaves
ctx.beginPath();
ctx.moveTo(256, 160);
ctx.lineTo(180, 240);
ctx.lineTo(332, 240);
ctx.closePath();
ctx.fillStyle = '#90ee90';
ctx.fill();

// Add some decorative yellow dots
ctx.fillStyle = '#ffeb3b';
const dots = [
    [256, 140], [220, 180], [292, 180],
    [200, 220], [312, 220], [256, 200]
];
dots.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
});

// Draw shadow
ctx.beginPath();
ctx.ellipse(256, 440, 100, 25, 0, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
ctx.fill();

// Save the image
const outputPath = path.join(__dirname, '..', 'public', 'default_avater', 'default-avater.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log('Tree avatar generated successfully at:', outputPath);