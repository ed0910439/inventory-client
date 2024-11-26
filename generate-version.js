const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'build');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // ç¢ºä¿ç›®éŒ„å­˜åœ¨
}
// Ã…ÂªÂ¨Ãº package.json
const packageJson = require('./package.json');

// Â´Â£Â¨ÃºÂªÂ©Â¥Â»Â¸Â¹
const version = {
    version: packageJson.version
};

const filePath = path.join(__dirname, 'build', 'version.json');
fs.writeFileSync(filePath, JSON.stringify(version, null, 2));

console.log('Generated version.json successfully.');
