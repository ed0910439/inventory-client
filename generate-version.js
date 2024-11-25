// generate-version.js
const fs = require('fs');
const path = require('path');

// 讀取 package.json
const packageJson = require('./package.json');

// 提取版本號
const version = {
    version: packageJson.version
};

// 將版本號寫入 version.json
const filePath = path.join(__dirname, 'build', 'version.json');
fs.writeFileSync(filePath, JSON.stringify(version, null, 2));

console.log('Generated version.json successfully.');
