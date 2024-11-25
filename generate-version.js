// generate-version.js
const fs = require('fs');
const path = require('path');

// Ū�� package.json
const packageJson = require('./package.json');

// ����������
const version = {
    version: packageJson.version
};

// �N�������g�J version.json
const filePath = path.join(__dirname, 'build', 'version.json');
fs.writeFileSync(filePath, JSON.stringify(version, null, 2));

console.log('Generated version.json successfully.');
