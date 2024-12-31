import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal'; // 引入確認模組
import Swal from 'sweetalert2'
import BouncyComponent from './BouncyComponent';

import Modal from './Modal'; // 引入一般信息模組

const InventoryUploader = forwardRef((props, ref) => {
    const [firstNewProducts, setFirstNewProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState({});
    const [loading, setLoading] = useState(false);
    const [completedProducts, setCompletedProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [year, setYear] = useState(2024);
    const [month, setMonth] = useState(12);
    const [store, setStore] = useState('');
    const [serverConnected, setServerConnected] = useState(null);
    const [eposConnected, setEposConnected] = useState(null);
    const [checkingConnections, setCheckingConnections] = useState(false);
    const [checkProgress, setCheckProgress] = useState('');

    const [confirmModalContent, setConfirmModalContent] = useState({});
    const [modalContent, setModalContent] = useState({});
    const [modalAction, setModalAction] = useState(null);
    const allVendors = ['全台', '央廚', '王座-備', '王座-食', '忠欣', '開元', '裕賀', '美食家', '點線麵'];
    const allLayers = ['未使用', '冷藏', '冷凍', '常溫', '清潔', '備品'];

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


    // 使 handleStartInventory 可從父組件調用
    useImperativeHandle(ref, () => ({
        startInventory: handleStartInventory
    }));
setCheckingConnections(true);

    const handleStartInventory = async () => {
        setCheckProgress('正在檢查門市資訊...');
        await delay(1500); // 等待1秒
        if (props.storeName === '') {
            console.error('Store name is required');
            Swal.fire('錯誤', '請先選擇門市。', 'error');

            return;

        }
        try {
            setCheckProgress('正在檢查伺服器連接...');
            await delay(1000); // 等待1秒

            // 檢查伺服器連接狀態
            const serverResponse = await axios.get(`${apiUrl}/api/checkConnections`);
            setServerConnected(serverResponse.data.serverConnected);
            console.log('Server status:', serverResponse.data.serverConnected);

            setCheckProgress('正在檢查 EPOS 主機連接...');
            await delay(1000); // 再次等待1秒

            // 檢查 EPOS 主機連接狀態
            const eposResponse = await axios.get(`${apiUrl}/api/ping`);
            setEposConnected(eposResponse.data.eposConnected);
            console.log('EPOS status:', eposResponse.data.eposConnected);

        } catch (error) {
            console.error('Error connecting to server:', error.response ? error.response.data : error.message);
        } finally {
            setCheckingConnections(false);
        }

        // 確認連線後的操作
        if (serverConnected === false || eposConnected === false) {
            Swal.fire('錯誤', '無法開始盤點，因為有主機離線。', 'error');

            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/startInventory/${props.storeName}`);
            setFirstNewProducts(response.data);
            setCompletedProducts(response.data.map(product => ({
                ...product,
                規格: '',
                廠商: '',
                庫別: ''
            })));
        } catch (error) {
            Swal.fire('錯誤', '取得盤點模板時發生錯誤！', 'error');

        } finally {
            setLoading(false);
        }
    };


        // 處理用戶輸入變更

    const handleInputChange = (index, field, value) => {
        setCompletedProducts(prev => {
            const updatedProducts = [...prev];
            updatedProducts[index][field] = value;
            return updatedProducts;
        });
    };

    const toggleSelectProduct = (index) => {
        setSelectedProducts(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleSelectAll = () => {
        const allSelected = Object.keys(selectedProducts).length === firstNewProducts.length;
        const newSelections = {};
        firstNewProducts.forEach((_, index) => {
            newSelections[index] = !allSelected; // 切换选择状态
        });
        setSelectedProducts(newSelections);
    };

    const saveCompletedProducts = async () => {
        // 遍历选择的产品并确保其信息有效
        const preparedProducts = completedProducts.map((product, index) => ({
            ...product,
            廠商: selectedProducts[index] ? product.廠商 : '未使用',
            庫別: selectedProducts[index] ? product.庫別 : '未使用',
        }));

        try {
            await axios.post(`${apiUrl}/api/saveCompletedProducts/${props.storeName}`, preparedProducts);
            Swal.fire('成功', '數據保存成功！正在刷新盤點數據。', 'success');
            // 延遲3秒後刷新頁面
            setTimeout(() => {
                setCompletedProducts([]);
                setFirstNewProducts([]);
                window.location.reload();
            }, 3000);
        } catch (error) {
            Swal.fire('錯誤', '產品數據保存失敗！', 'error');

        }
    };
    return (
    <div>
            {loading && (
                <div><BouncyComponent />
                </div>

            )} 
            {firstNewProducts.length > 0 && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>新品列表</h2>
                        <p>下面為本期新增品項，請勾選門市有使用的品項，並修改其廠商及庫別後提交</p>
                            <table className="in-table" style={{ width: 'auto', padding: '10px', margin: '10px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '5px', margin: '5px' }}><input type="checkbox" onChange={toggleSelectAll} /></th>
                                        <th style={{ padding: '5px', margin: '5px' }}>編號</th>
                                        <th style={{ padding: '5px', margin: '5px' }}>品名</th>
                                        <th style={{ padding: '5px', margin: '5px' }}>廠商</th>
                                        <th style={{ padding: '5px', margin: '5px' }}>庫別</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {firstNewProducts.map((product, index) => (
                                        <tr key={index} className={`product-row ${selectedProducts[index] ? 'selected' : ''}`}>
                                            <td style={{ padding: '5px', margin: '5px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedProducts[index]}
                                                    onChange={() => toggleSelectProduct(index)}
                                                />
                                            </td>
                                            <td style={{ padding: '5px', margin: '5px' }}>{product.商品編號}</td>
                                            <td style={{ width: '100%', padding: '5px', margin: '5px' }}>{product.商品名稱}</td>
                                            <td style={{ padding: '5px', margin: '5px' }}>
                                                <select
                                                    value={completedProducts[index]?.廠商 || '未使用'}
                                                    onChange={e => handleInputChange(index, '廠商', e.target.value)}
                                                    disabled={!selectedProducts[index]}
                                                >
                                                    <option value="未使用" disabled>選擇廠商</option>
                                                    {allVendors.map(vendor => (
                                                        <option key={vendor} value={vendor}>{vendor}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: '5px', margin: '5px' }}>
                                                <select
                                                    value={completedProducts[index]?.庫別 || '未使用'}
                                                    onChange={e => handleInputChange(index, '庫別', e.target.value)}
                                                    disabled={!selectedProducts[index]}
                                                >
                                                    <option value="未使用" disabled>選擇庫別</option>
                                                    {allLayers.map(layer => (
                                                        <option key={layer} value={layer}>{layer}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button onClick={saveCompletedProducts}>提交資料</button>
                        </div>
                    </div>
            )}
            {checkingConnections && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>連線檢查進度</h2>
                        <p>{checkProgress}</p>
                        <p>作業門市：{props.storeName === 'noStart' ? '檢查中...' : props.storeName}</p>
                        <p>伺服器：{serverConnected === null ? '檢查中...' : (serverConnected ? '在線' : '離線')}</p>
                        <p>EPOS 主機：{eposConnected === null ? '檢查中...' : (eposConnected ? '在線' : '離線')}</p>
                    </div>
                </div>
            )}
                <Modal
                    isOpen={isModalOpen}
                    title={modalContent.title}
                    message={modalContent.message}
                    type={modalContent.type}
                    onClose={() => setIsModalOpen(false)}
                />
                <ConfirmModal
                    isOpen={isConfirmModalOpen}
                    title={confirmModalContent.title}
                    message={confirmModalContent.message}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={() => {
                        if (modalAction) {
                            modalAction();
                            setModalAction(null);
                        }
                    }}
                />
            </div>

    );
});

export default InventoryUploader;
