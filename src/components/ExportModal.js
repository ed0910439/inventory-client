import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs'; // 確保引入 ExcelJS

const ExportModal = ({ isOpen, onClose, products }) => {
    const currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = currentDate.getDate();

    if (day < 16) {
        month -= 1;
        if (month === 0) {
            month = 12;
            year -= 1;
        }
    }

    const exportToExcel = async (data) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Products');

        worksheet.columns = [
            { header: '商品編號', key: '商品編號', width: 20 },
            { header: '商品名稱', key: '商品名稱', width: 30 },
            { header: '數量', key: '數量', width: 10 },
            { header: '單位', key: '單位', width: 10 },
            { header: '到期日', key: '到期日', width: 15 }
        ];

        data.filter(item => item.庫別 !== '未使用').forEach(item => {
            worksheet.addRow({
                ...item,
                數量: item.數量 || 0
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, `盤點匯出-${new Date().toISOString().slice(0, 10)}.xls`);
    };

    const exportToExcelEpos = async (data, year, month) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Products');

        worksheet.columns = [
            { header: '商品编号', key: '商品編號', width: 20 },
            { header: '商品名称', key: '商品名稱', width: 30 },
            { header: '数量', key: '數量', width: 10 },
            { header: '单位', key: '單位', width: 10 },
            { header: '盘點日期', key: '盤點日期', width: 15 }
        ];

        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const inventoryDate = new Date(year, month - 1, lastDayOfMonth).toISOString().split('T')[0];

        data.forEach(item => {
            worksheet.addRow({
                ...item,
                數量: item.數量 || 0,
                盤點日期: inventoryDate
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, `EPos_${new Date().toISOString().slice(0, 10)}.xls`);
    };

    const handleExportToEpos = (exportYear, exportMonth) => {
        exportToExcelEpos(products, exportYear, exportMonth);
    };

    const handleExport = () => {
        exportToExcel(products);
    };

    useEffect(() => {
        if (isOpen) {
            Swal.fire({
                title: '盤點匯出',
                html: `
                    <label><input id="year-input" style="color: inherit; font-size: 1.125em; width: 3.125em; text-align: center; border: 0px;" type="number" value="${year}" min="2000" max="2100"/>
                    年<input id="month-input" style="color: inherit; font-size: 1.125em;width: 50px; text-align: center; border: 0px;" type="number" value="${month}" min="1" max="12"/>
                    月</label><br/>
                `,
                showCancelButton: true,
                showConfirmButton: true,
                cancelButtonColor: '#7066e0',
                confirmButtonText: 'EPOS格式',
                cancelButtonText: '一般格式',
                focusConfirm: false,
                footer: '<a>EPOS格式：直接匯入EPOS系統，無須轉檔<br>一般格式：帶有到期日的盤點單。</a>',
                preConfirm: () => {
                    const yearValue = document.getElementById('year-input').value;
                    const monthValue = document.getElementById('month-input').value;

                    return {
                        year: parseInt(yearValue), // 確保年份是整數
                        month: parseInt(monthValue, 10).toString().padStart(2, '0') // 將月份格式化為兩位數
                    };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // 選擇了 EPOS 格式
                    handleExportToEpos(result.value.year, result.value.month);
                } else {
                    // 選擇了一般格式
                    handleExport();
                }
                onClose(); // 關閉 SweetAlert2 的模態框
            });
        }
    }, [isOpen, onClose]); // 依賴 isOpen 和 onClose

    return null; // 因為這是一個提示模態，所以組件本身不渲染任何其他內容
};

export default ExportModal;
