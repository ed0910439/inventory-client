const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'build');
if (!fs.existsSync(dir)) {
<<<<<<< HEAD
    fs.mkdirSync(dir, { recursive: true }); // 確�??��?存在
}
// ?ª¨ú package.json
=======
    fs.mkdirSync(dir, { recursive: true }); // ç¢ºä¿ç›®éŒ„å­˜åœ¨
}
// Ã…ÂªÂ¨Ãº package.json
>>>>>>> 971f790cd2f70c4ba418b1c1d6640390ea428362
const packageJson = require('./package.json');

// Â´Â£Â¨ÃºÂªÂ©Â¥Â»Â¸Â¹
const version = {
    version: packageJson.version
};

<<<<<<< HEAD

=======
>>>>>>> 971f790cd2f70c4ba418b1c1d6640390ea428362
const filePath = path.join(__dirname, 'build', 'version.json');
fs.writeFileSync(filePath, JSON.stringify(version, null, 2));

console.log('Generated version.json successfully.');
