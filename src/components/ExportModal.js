import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './Modal.css';

const ExportModal = ({ isOpen, onClose, products }) => {
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
	
	//匯出為EPOS上傳格式
    const handleExportToEpos = () => {
        // 確保用戶輸入了 year 和 month
        if (!year || !month) {
            alert('請先輸入盤點的年和月！');
            return;
        }
        EcportToExcelEpos(products, year, month);
    };
    //匯出為一般格式
    const handleExport = () => {
        EcportToExcel(products);
    };
	
	const EcportToExcel = async (data) => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Products');
        // 添加表頭
        worksheet.columns = [
            { header: '商品編號', key: '商品編號', width: 20 },
            { header: '商品名稱', key: '商品名稱', width: 30 },
            { header: '數量', key: '數量', width: 10 },
            { header: '單位', key: '單位', width: 10 },
            { header: '到期日', key: '到期日', width: 15 }

        ];
        
        // 添加數據
        data.filter(item => item.廠商 !== '#N/A').forEach(item => {
            worksheet.addRow({
                ...item,
                數量: item.數量 || 0 // 如果數量為空，則設為 0
            });
        });
        // 導出 Excel 文件
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, `盤點匯出-${new Date().toISOString().slice(0, 10)}.xls`);
    };

    const EcportToExcelEpos = async (data, year, month) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Products');

        // 添加表頭
        worksheet.columns = [
            { header: '商品编号', key: '商品編號', width: 20 },
            { header: '商品名称', key: '商品名稱', width: 30 },
            { header: '数量', key: '數量', width: 10 },
            { header: '单位', key: '單位', width: 10 },
            { header: '盘点日期', key: '盤點日期', width: 15 }

        ];
        // 計算該月的最後一天
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const inventoryDate = new Date(year, month - 1, lastDayOfMonth).toISOString().split('T')[0];

        // 添加數據
        data.forEach(item => {
            worksheet.addRow({
                ...item,
			    數量: item.數量 || 0, // 如果數量為空，則設為 0
                盤點日期: inventoryDate
            });
        });

        // 導出 Excel 文件
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, `EPos_${new Date().toISOString().slice(0, 10)}.xls`);
    };

		    if (!isOpen) return null;

	return (
  <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content"  id="style-3" onClick={(e) => e.stopPropagation()}>
                        <div>
                            <h2>盤點匯出</h2>
                            <label>年份：<input type="number" value={year} onChange={e => setYear(e.target.value)} min="2000" max="2100" required /></label>
                            <label>　</label>
                            <label>月份：<input type="number" value={month} onChange={e => setMonth(e.target.value)} min="1" max="12" required /></label>

                            <br /><br />
                            <div>
                                <button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={handleExportToEpos}>EPOS上傳格式</button>
                                <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={handleExport}>一般格式</button>
                                <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={onClose}>取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )
};
export default ExportModal;
