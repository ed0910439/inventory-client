const express = require('express');
const app = express();
const path = require('path');

// 靜態目錄
app.use(express.static(path.join(__dirname, 'public'))); // 假設 public 是靜態文件目錄

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/');
});
