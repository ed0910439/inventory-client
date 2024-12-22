import React, { useState } from 'react';
import axios from 'axios';
import { exportToExcel } from './ExportToExcel';

const ArchiveModal = ({ isOpen, onClose, products }) => {
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [password, setPassword] = useState('');
  
    const handleSubmit = async () => {
        if (!year || !month || !password) {
            alert('請填寫所有欄位！');
            return;
        }

        try {
            const response = await axios.post(`https://inventory.edc-pws.com/api/archive`, {
                year, month, password
            });

            // 正確調用 exportToExcel 函數
            await exportToExcel(products, year, month, true); // 假設 true 代表 EPOS 格式
            
            alert('歸檔成功：' + JSON.stringify(response.data));
            // 重置狀態
            resetStates();
            onClose(); // 關閉模態框
        } catch (error) {
            console.error('歸檔請求失敗:', error);
            alert('歸檔失敗:請檢查網路連接狀態或稍後再試\n' + (error.response ? error.response.data : error.message));
        }
    };

    const resetStates = () => {
        setYear('');
        setMonth('');
        setPassword('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>
                <div>
                    <h2>盤點歸檔</h2>
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <label>年份：
                                        <input type="number" value={year} onChange={e => setYear(e.target.value)} min="2000" max="2100" required />
                                    </label>
                                </td>
                                <td>
                                    <label>月份：
                                        <input type="number" value={month} onChange={e => setMonth(e.target.value)} min="1" max="12" required />
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" style={{ borderCollapse: 'collapse', border: 'white' }}>
                                    <label>管理員密碼：
                                        <input style={{ width: '145px' }} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                                    </label>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div>
                        <button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={handleSubmit}>存檔</button>
                        <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={onClose}>取消</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchiveModal;