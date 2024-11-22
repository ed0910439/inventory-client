import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data, year, month, onEposFormat) => {
    // 確保用戶輸入了 year 和 month
    if (onEposFormat && (!year || !month)) {
        alert('請先輸入盤點的年和月！');
        return;
    }

    // 根據格式選擇導出方法
    if (onEposFormat) {
        await exportToExcelEpos(data, year, month);
    } else {
        await exportToExcelGeneral(data);
    }
};

// 導出為一般格式
const exportToExcelGeneral = async (data) => {
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
    saveAs(blob, `${new Date().toISOString().slice(0, 10)}-inventory.xls`);
};

// 導出為 EPOS 格式
const exportToExcelEpos = async (data, year, month) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // 添加表頭
    worksheet.columns = [
        { header: '商品编号', key: '商品編號', width: 20 },
        { header: '商品名称', key: '商品名稱', width: 30 },
        { header: '数量', key: '數量', width: 10 },
        { header: '单位', key: '單位', width: 10 },
        { header: '盘點日期', key: '盤點日期', width: 15 }
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
    saveAs(blob, `EPos${new Date().toISOString().slice(0, 10)}-inventory.xls`);
};
