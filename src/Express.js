const express = require('express');
const app = express();
const path = require('path');

// �R�A�ؿ�
app.use(express.static(path.join(__dirname, 'public'))); // ���] public �O�R�A���ؿ�

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/');
});
