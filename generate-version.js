const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'build');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // 確保目錄存在
}
// Åª¨ú package.json
const packageJson = require('./package.json');

// ´£¨úª©¥»¸¹
const version = {
    version: packageJson.version
};

<<<<<<< HEAD
// �N�������g�J version.json
const filePath = path.join(__dirname, public, 'version.json');
=======
// ±Nª©¥»¸¹¼g¤J version.json
const filePath = path.join(__dirname, 'build', 'version.json');
>>>>>>> 051dc4e7f9409213b1167ca8111bfb56b0a941ba
fs.writeFileSync(filePath, JSON.stringify(version, null, 2));

console.log('Generated version.json successfully.');
