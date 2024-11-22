import React, { useState } from 'react';
import axios from 'axios';

function StartInventory({ isOpen, onClose }) {
    const [inventoryTemplate, setInventoryTemplate] = useState(null);
    const [initialStockData, setInitialStockData] = useState(null);
    const [uploadError, setUploadError] = useState('');

    if (!isOpen) return null;
    // 處理盤點模板檔案變更
    const handleInventoryTemplateChange = (e) => {
        setInventoryTemplate(e.target.files[0]);
    };

    // 處理期初庫存數據檔案變更
    const handleInitialStockDataChange = (e) => {
        setInitialStockData(e.target.files[0]);
    };

    // 提交表單處理
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploadError(''); // 清除之前的錯誤訊息

        if (!inventoryTemplate || !initialStockData) {
            setUploadError('請選擇盤點模板和期初數據檔案');
            return;
        }

        const formData = new FormData();
        formData.append('inventoryTemplate', inventoryTemplate);
        formData.append('initialStockData', initialStockData);

        try {
            const response = await axios.post(`http://localhost:4000/api/startInventory`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('上傳成功:', response.data);
            alert('盤點數據已成功上傳!');
            // 清除選擇的檔案
            setInventoryTemplate(null);
            setInitialStockData(null);
            setIsModalOpen(false); // 關閉彈窗

        } catch (error) {
            console.error('上傳失敗:', error);
            setUploadError(error.response ? error.response.data.error : '上傳失敗，請稍後再試');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>

                <h2 style={{ fontFamily: 'Chocolate Classical Sans, sans-serif'}}>開始盤點</h2>
                <form onSubmit={handleSubmit}>
                    <p>盤點模板：<input type="file" accept=".xls,.xlsx" onChange={handleInventoryTemplateChange} required />
                    </p>
                    <p>
                        期初數據：
                        <input type="file" accept=".xls,.xlsx" onChange={handleInitialStockDataChange} required />
                    </p>
                    {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                    <button type="submit">上傳</button>
                    <button type="button" onClick={onClose}>取消</button>
                </form>
            </div>
        </div>
    );
}

export default StartInventory;