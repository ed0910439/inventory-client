import React, { useState } from 'react';
import axios from 'axios';

function StartInventory() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inventoryTemplate, setInventoryTemplate] = useState(null);
    const [initialStockData, setInitialStockData] = useState(null);
    const [uploadError, setUploadError] = useState(''); // 錯誤訊息


    const handleInventoryTemplateChange = (e) => {
        setInventoryTemplate(e.target.files[0]);
    };

    const handleInitialStockDataChange = (e) => {
        setInitialStockData(e.target.files[0]);
    };


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
            const response = await axios.post('/api/startInventory', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('上傳成功:', response.data);
            alert('盤點數據已成功上傳!');
            setIsModalOpen(false); // 關閉彈窗

        } catch (error) {
            console.error('上傳失敗:', error);
            setUploadError(error.response ? error.response.data.error : '上傳失敗，請稍後再試');
        }
    };



    return (
        <div>
            <button onClick={() => setIsModalOpen(true)}>開始盤點</button>

            {/* 彈窗 */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>開始盤點</h2>
                        <form onSubmit={handleSubmit}>
                            <p>
                                盤點模板：
                                <input type="file" accept=".xls,.xlsx" onChange={handleInventoryTemplateChange} required />
                            </p>
                            <p>
                                期初數據：
                                <input type="file" accept=".xls,.xlsx" onChange={handleInitialStockDataChange} required />
                            </p>
                            {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                            <button type="submit">上傳</button>
                            <button onClick={() => setIsModalOpen(false)}>取消</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default StartInventory;
