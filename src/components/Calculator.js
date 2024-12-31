import React, { useState } from 'react';
import './Calculator.css';  // 新建一個 CSS 檔來增加樣式

const Calculator = ({ onCalculate, onClose }) => {
    const [value1, setValue1] = useState(0);
    const [value2, setValue2] = useState(0);
    const [result, setResult] = useState(0);

    const handleCalculate = () => {
        const calculatedResult = Number(value1) + Number(value2); // 您可以根據需要更改計算邏輯
        setResult(calculatedResult);
        onCalculate(calculatedResult);
    };

    return (
        <div className="floating-calculator">
            <button onClick={onClose} className="close-button">✖</button> {/* 用於關閉計算機 */}
            <input type="number" value={value1} onChange={(e) => setValue1(e.target.value)} placeholder="輸入第一個數" />
            <input type="number" value={value2} onChange={(e) => setValue2(e.target.value)} placeholder="輸入第二個數" />
            <button onClick={handleCalculate}>計算</button>
            <div>結果: {result}</div>
        </div>
    );
};

export default Calculator;
