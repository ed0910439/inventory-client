import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { exportToExcel } from './ExportToExcel';

const ArchiveModal = forwardRef(({ isOpen, onClose, products, storeName }, ref) => {
    const [password, setPassword] = useState('');
    const [emptyQuantityProducts, setEmptyQuantityProducts] = useState([]);
    const [isArchived, setIsArchived] = useState(false); // 用于跟踪归档状态

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = currentDate.getDate();
    const adjustedMonth = day < 16 
        ? (month === '01' ? '12' : String(parseInt(month) - 1).padStart(2, '0')) 
        : month;

    useImperativeHandle(ref, () => ({
        handleSubmit() {
            handleSubmit();
        }
    }));

    const checkEmptyQuantities = () => {
        const emptyProducts = products.filter(product =>
            product.庫別 !== '未使用' && (!product.數量)
        );
        setEmptyQuantityProducts(emptyProducts);
    };

    const handleSubmit = async () => {
        if (isArchived) {
            Swal.fire('錯誤', '歸檔操作已完成，無法再次執行！', 'error');
            return; // 如果已经归档，显示错误信息并返回
        }

        checkEmptyQuantities();

        if (emptyQuantityProducts.length > 0) {
            const productNames = emptyQuantityProducts.map(p => p.商品名稱).join(', ');

            const result = await Swal.fire({
                title: '警告！',
                html: `<p>以下產品的數量為空：</p><div style="color: red; margin-top: 10px; text-align: left">${productNames}</div>`,
                text: '請問您是否繼續',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '是',
                cancelButtonText: '否'
            });

            if (result.isConfirmed) {
                await toArchive();
            }
            return;
        }

        await toArchive();
    };

const toArchive = async () => {
    try {
        const response = await axios.post(`${apiUrl}/api/archive/${storeName}`, { password: 'Dcz423008' },{    headers: {
      'Content-Type': 'application/json',
    }});
        await exportToExcel(products, year, adjustedMonth, true);

        Swal.fire('成功', '歸檔成功：' + JSON.stringify(response.data), 'success');
        setIsArchived(true);
        resetStates();
        onClose();
    } catch (error) {
        console.error('歸檔請求失敗:', error);
        Swal.fire('錯誤', '歸檔失敗：' + (error.response ? error.response.data : error.message), 'error');
        resetStates();
    }
};

    const resetStates = () => {
        setPassword('');
        setEmptyQuantityProducts([]);
        setIsArchived(false); // 重置归档状态，以便下次能够再次执行
    };

    const handlePasswordPrompt = () => {
        Swal.fire({
            title: '確定歸檔?',
            html: `<label>管理員密碼： <input id="swal-password" style="width: 145px;" type="password" required /></label>`,
            text: '請確認是否要存檔所有產品資料。',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            preConfirm: () => {
                const inputElement = document.getElementById('swal-password');
                const passwordInput = inputElement ? inputElement.value : '';

                if (!passwordInput) {
                    Swal.showValidationMessage('請輸入密碼');
                    return;
                }
                setPassword(passwordInput);
                return passwordInput;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                handleSubmit();
            } else {
                onClose();
            }
        });
    };

    useEffect(() => {
        if (isOpen) {
            resetStates(); // 确保每次打开模态框时重置状态
            handlePasswordPrompt();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>
                <h2>歸檔操作進行中...</h2>
            </div>
        </div>
    );
});

export default ArchiveModal;
