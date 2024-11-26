const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const distDir = path.join(__dirname, '../dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Copy all files from public to dist
fs.readdirSync(publicDir).forEach(file => {
    fs.copyFileSync(
        path.join(publicDir, file),
        path.join(distDir, file)
    );
});

console.log('Public files copied to dist successfully!'); 