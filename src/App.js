//App.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import io from 'socket.io-client';
import * as XLSX from 'xlsx';

const socket = io('https://inventory.edc-pws.com'); // 根据需要可能更改

// 样式定义
const modalStyles = {
    lineHeight: '1.8',
    display: 'flex',
    justifyContent: 'center',
    position: 'fixed',
    background: 'white',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 50px rgba(0, 0, 0, 0.3)',
    zIndex: 1000, // 确保弹窗在其他内容上方
};
const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
};

const modalStylesGuide = {
    lineHeight: '1.8',
    display: 'flex',
    justifyContent: 'center',
    left: '8.5%',

    position: 'fixed',
    background: 'white',
    maxWidth: '657px',
    maxHeight: '70%',
    overflowY: 'auto', // 允許垂直滾動
    backgroundColor: 'white',
    border: '1px solid #ccc',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 0 50px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    transform: 'translateY(10%)' // 垂直稍微下移，防止與頂部條件放在一起
};
const App = () => {
    const [latestVersion, setLatestVersion] = useState(null);
    const currentVersion = '1.0.3'; // 應用程式的當前版本號
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true); // 載入狀態
    const [initialStockData, setInitialStockData] = useState({}); // 存儲期初庫存
    const [selectedVendors, setSelectedVendors] = useState([]); // 儲存選中的廠商
    const [selectedLayers, setSelectedLayers] = useState([]); // 儲存選中的溫層
    const [newMessage, setNewMessage] = useState(''); // 儲存新數據提示內容
    const [showToast, setShowToast] = useState(false); // 控制提示顯示
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [showGuide, setShowGuide] = useState(false); // 控制顯示說明手冊
    const [isUserOffline, setIsUserOffline] = useState(false); // 控制顯示離線提示框
    const idleTimeout = 600000; // 閒置10分鐘 （600,000毫秒）

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState(null); // 懸停的商品編號
    const [initialStock, setInitialStock] = useState(''); // 用於顯示期初庫存量
    const [currentSpec, setCurrentSpec] = useState(''); // 用於顯示規格
    const [showOfflineWarning, setShowOfflineWarning] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const inputRefs = useRef([]); // 用於儲存每個輸入框的引用
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [userCount, setUserCount] = useState(0); // 用於存儲線上人數
    const [initialUnit, setInitialUnit] = useState(''); // 用於存儲期初庫存量
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 }); // 記錄工具提示的位置
    const [password, setPassword] = useState('');
    const [newProduct, setNewProduct] = useState({ // 用于新產品的初始状态
        商品編號: '',
        商品名稱: '',
        規格: '',
        數量: 0,
        單位: '',
        到期日: '',
        廠商: '',
        溫層: '',
        盤點日期: '',

    });
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [files, setFiles] = useState({
        stock: null,
        currentMonth: null,
        initialStock: null,
        finalStock: null,
        outTransfer: null,
        inTransfer: null,
    });

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true); // 開始載入，設置狀態

            try {
                const response = await axios.get('https://inventory.edc-pws.com/api/products');
                setProducts(response.data);
                setConnectionStatus('連接成功 ✔');
                setLoading(false); // 載入完成，更新狀態
            } catch (error) {
                console.error("取得產品時出錯:", error.response ? error.response.data : error.message);
                setConnectionStatus('失去連線 ❌');


            }
        };
        const fetchVersion = async () => {
            try {
                const response = await axios.get('/version.json'); // 獲取最新版本號
                const serverVersion = response.data.version;
                const localVersion = '1.0.3'; // 當前應用版本號
                if (serverVersion !== localVersion) {
                    alert('有新版本可用！請將頁面重新整理！');
                }
            } catch (error) {
                console.error('取得版本更新失敗:', error);
            }
        };
        const fetchInitialStockData = async () => {
            try {
                const response = await axios.get('https://inventory.edc-pws.com/archive/originaldata');
                const initialStockMap = {};
                response.data.forEach(item => {
                    initialStockMap[item.商品編號] = item.數量; // 儲存成物件以便查詢
                });
                setInitialStockData(initialStockMap);
            } catch (error) {
                console.error("獲取期初庫存數據時出錯:", error);
            }
        };

        fetchProducts();
        fetchVersion();
        fetchInitialStockData();

        // 監聽連接的用戶數更新
        socket.on('updateUserCount', (count) => {
            setUserCount(count);
        });

        // 设置 socket 监听和事件处理
        socket.on('連接成功', () => {
            setConnectionStatus('連接成功1');
        });

        socket.on('失去連線', () => {
            setConnectionStatus('失去連線');
        });

        socket.on('productUpdated', (updatedProduct) => {
            setProducts(prevProducts =>
                prevProducts.map(product =>
                    product.商品編號 === updatedProduct.商品編號 ? updatedProduct : product
                )
            );

            // 顯示新數據的位置提示
            setNewMessage(`使用者: ${socket.id} 修改 ${updatedProduct.商品編號}-${updatedProduct.商品名稱} 數量為  ${updatedProduct.數量}`);
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 4000);

        });


        let timer;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                setConnectionStatus('Disconnected');
                setIsUserOffline(true);
            }, idleTimeout);
        };

        // 註冊用戶活動事件來重置計時器
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);

        resetTimer(); // 初始重置計時器

        // 在组件卸载時清理事件监听
        return () => {
            clearTimeout(timer);
            socket.off('連接成功');
            socket.off('失去連線');
            socket.off('productUpdated');
            socket.off('updateUserCount');
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
        };
    }, []);

    const handleReconnect = () => {
        setConnectionStatus('Connected');
        setIsUserOffline(false);
    };

    const handleBlur = () => {
        setHoveredProduct(null);
        setInitialStock('');
    };
    // 控制廠商篩選
    const handleVendorChange = (vendor) => {
        setSelectedVendors((prev) =>
            prev.includes(vendor) ? prev.filter(v => v !== vendor) : [...prev, vendor]
        );
    };

    // 控制溫層篩選
    const handleLayerChange = (layer) => {
        setSelectedLayers((prev) =>
            prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
        );
    };

    // 根據所選的廠商和溫層過濾產品
    const filteredProducts = products.filter(product => {
        const vendorMatch = selectedVendors.length === 0 || selectedVendors.includes(product.廠商);
        const layerMatch = selectedLayers.length === 0 || selectedLayers.includes(product.溫層);
        return vendorMatch && layerMatch; // 只顯示符合篩選條件的產品
    });

    const handleKeyPress = (event, index) => {
        if (event.key === 'Enter') {
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus(); // 將焦點移到下一個輸入框
            }
        }
    };

    const exportToExcel = async (data) => {
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
        // 計算導出日期
        const exportDate = new Date();

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

    const exportToExcelEpos = async (data, year, month) => {
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
        // 計算導出日期
        const exportDate = new Date();
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
    //匯出為EPOS上傳格式
    const handleExportToEpos = () => {
        // 確保用戶輸入了 year 和 month
        if (!year || !month) {
            alert('請先輸入盤點的年和月！');
            return;
        }
        exportToExcelEpos(products, year, month);
    };
    //匯出為一般格式
    const handleExport = () => {
        exportToExcel(products);
    };
    const updateQuantity = async (productCode, quantity) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/quantity`, { 數量: quantity });
        } catch (error) {
            console.error("更新產品時出錯:", error);
        }
    };

    const updateExpiryDate = async (productCode, expiryDate) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/expiryDate`, { 到期日: expiryDate });
        } catch (error) {
            console.error("更新到期日時出錯:", error);
        }
    };

    const handleQuantityChange = (productCode, quantity) => {
        if (quantity < 0) { alert("數量不能為負。"); return; } const updatedProducts = products.map(product =>
            product.商品編號 === productCode ? { ...product, 數量: quantity } : product
        );

        setProducts(updatedProducts);
        updateQuantity(productCode, quantity);
    };

    const handleExpiryDateChange = (productCode, expiryDate) => {
        const updatedProducts = products.map(product =>
            product.商品編號 === productCode ? { ...product, 到期日: expiryDate } : product
        );

        setProducts(updatedProducts);
        updateExpiryDate(productCode, expiryDate);
    };

    // 開啟新增產品的模態框，並關閉盤點歸檔的模態框
    const openProductModal = () => {
        setIsModalOpen(true);
        setIsArchiveModalOpen(false);
        setShowGuide(false);
    };
    // 開啟盤點歸檔的模態框，並關閉新增產品的模態框
    const openExportModal = () => {
        setIsExportModalOpen(true);
        setIsArchiveModalOpen(false);
        setIsModalOpen(false);
        setShowGuide(false);

    };
    // 開啟盤點歸檔的模態框，並關閉新增產品的模態框
    const openArchiveModal = () => {
        setIsArchiveModalOpen(true);
        setIsModalOpen(false);
        setShowGuide(false);

    };
    const handleArchiveSubmit = async () => {
        if (!year || !month || !password) {
            alert('請填寫所有欄位！');
            return;
        }

        try {
            const response = await axios.post('https://inventory.edc-pws.com/api/archive', {
                year, month, password
            });
            exportToExcel(products, year, month);// 在盤點歸檔時同樣導出
            alert('歸檔成功：' + JSON.stringify(response.data));
            setIsArchiveModalOpen(false);
        } catch (error) {
            console.error('歸檔請求失敗:', error);
            alert('歸檔失敗:請檢查網路連接狀態或稍後再試\n' + (error.response ? error.response.data : error.message));
        }
    };
    // 新增產品的狀態處理
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prevProduct => ({ ...prevProduct, [name]: value }));
    };
    // 新增產品的邏輯處理
    const handleAddProduct = async () => {
        try {
            const nextNumber = products.length + 1; // 下一个編號
            const newProductWithNumber = {
                ...newProduct,
                商品編號: `新 - ${nextNumber}`,
            };

            const response = await axios.post('https://inventory.edc-pws.com/api/products', newProductWithNumber);
            setProducts([...products, response.data]); // 更新產品列表
            setIsModalOpen(false); // 关闭弹窗
            setNewProduct({
                商品編號: '',
                商品名稱: '',
                規格: '',
                數量: 0,
                單位: '',
                到期日: '',
                溫層: '',
                廠商: '',
            }); // 重置新產品状态
        } catch (error) {
            console.error("新增產品時出錯:", error);
        }
    };

    const handleMouseEnter = (product, e) => {
        setHoveredProduct(product.商品編號); // 設置當前懸停的商品編號
        setInitialStock(initialStockData[product.商品編號] || '未設定'); // 查找對應的期初庫存
        setCurrentSpec(product.規格); // 設置當前商品的規格
        const rect = e.currentTarget.getBoundingClientRect(); // 獲取當前商品行的邊界

        setTooltipPosition({ top: e.clientY + 10, left: e.clientX + 10 }); // 更新工具提示位置
    };

    const handleMouseLeave = () => {
        setHoveredProduct(null); // 清除懸停商品
        setInitialStock(''); // 清除期初庫存數據
        setCurrentSpec(''); // 清除規格數據
    };
    // 控制說明手冊的顯示與隱藏
    const toggleGuide = () => {
        setShowGuide(true);
        setIsModalOpen(false);
        setIsArchiveModalOpen(false);
    };

    //合併檔案
    // 主组件

    const handleFileChange = (event, key) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [key]: file })); // 確保更新正確的文件狀態
        }
    };

    const uploadFiles = async () => {
        // 处理上传的文件
        await processFiles(files);
        setUploadModalOpen(false); // 关闭对话框
    };

    return (
        <div>
            {/* 載入提示 */}
            {loading && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div>
                        <h2>載入中...</h2>
                        <div style={{ width: '100%', backgroundColor: '#ddd', borderRadius: '5px' }}>
                            <div style={{ height: '10px', width: '100%', backgroundColor: '#4caf50' }} /></div>
                    </div>
                </div>
            )}
            {/* 導航條 */}
            <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '10px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-center', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ccc' }}>
                <div style={{ margin: 0, textAlign: 'left' }}>
                    <label>伺　服　器：<strong>{connectionStatus}</strong></label><br />
                    <label>線上使用者：<strong>{userCount}</strong>人</label>
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2em', display: 'inline-block' }}>庫存盤點系統</h1>
                </div>
                <div>
                    <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '45.84px' }} onClick={toggleGuide}>說明</button>
                    <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={openArchiveModal}>歸檔</button>
                    <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={openProductModal}>缺漏</button><br />
                    <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '45.84px', marginTop: '5px' }} onClick={openExportModal}>導出 Excel</button>
                    <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={() => setUploadModalOpen(true)}>匯總報表</button>

                </div>
            </nav>
            <div style={{ paddingTop: '80px' }}></div>
            {/* 篩選功能 */}
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <br />
                <label>　　　　　<strong>廠商</strong>：</label>
                {['全台', '央廚', '王座', '開元', '裕賀', '美食家', '點線麵'].map(vendor => (
                    <label key={vendor}>
                        <input type="checkbox" checked={selectedVendors.includes(vendor)} onChange={() => handleVendorChange(vendor)} />
                        {vendor}
                    </label>
                ))}
                <br />
                <label>　　　　　<strong>溫層</strong>：</label>{['冷藏', '冷凍', '常溫', '備品', '清潔'].map(layer => (
                    <label key={layer}>
                        <input
                            type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => handleLayerChange(layer)} />
                        {layer}
                    </label>
                ))}
            </div>
            {/* 表格本體 */}
            <table>
                <thead>
                    <tr>
                        <th>商品編號</th>
                        <th>商品名稱</th>
                        <th style={{ width: '60px' }}>數量</th>
                        <th>單位</th>
                        <th>到期日</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((product, index) => (
                        product.廠商 !== '#N/A' && ( // 顯示時排除廠商值為 #N/A 的行
                            <tr key={product.商品編號}>
                                <td>{product.商品編號}</td>
                                <td className='name' onMouseEnter={(e) => handleMouseEnter(product, e)} onMouseLeave={handleMouseLeave} style={{ cursor: 'pointer' }} >{product.商品名稱}</td>
                                <td style={{ width: '60px' }}><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyDown={(e) => handleKeyPress(e, index)} data-index={index} required /></td>
                                <td>{product.單位}</td>
                                <td><input className='date' type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} /></td>
                            </tr>
                        )))}
                </tbody>
            </table>
            {/* 顯示工具提示 */}
            {hoveredProduct && (
                <div style={{
                    textAlign: 'left',
                    fontSize: '12px',
                    position: 'fixed',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    padding: '5px',
                    borderRadius: '5px',
                    zIndex: 1000,
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                }}>
                    期初庫存量：{initialStock}<br />
                    規格：{currentSpec} {/* 顯示規格 */}

                </div>
            )}
            {/* 短暫提示 */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#4caf50', // 可根據需要更改顏色
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                }}>
                    {newMessage}
                </div>
            )}
            {/* 合併檔案 */}
            {isUploadModalOpen && (
                <div style={overlayStyles} onClick={() => isUploadModalOpen(false)}>
                    <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
                        <div><h2>合併至進銷存</h2>

                            <p>進銷存：<input type="file" onChange={(e) => handleFileChange(e, 'stock')} /></p>
                            <p>本月進貨：<input type="file" onChange={(e) => handleFileChange(e, 'currentMonth')} /></p>
                            <p>期初盤點：<input type="radio" name="initialStock" value="system" />使用系統數據<input type="file" onChange={(e) => handleFileChange(e, 'initialStock')} /></p>
                            <p>期末盤點：<input type="radio" name="finalStock" value="system" />使用系統數據<input type="file" onChange={(e) => handleFileChange(e, 'finalStock')} /></p>
                            <p>調出：<input type="file" onChange={(e) => handleFileChange(e, 'outTransfer')} /></p>
                            <p>調入：<input type="file" onChange={(e) => handleFileChange(e, 'inTransfer')} /></p>

                            <button onClick={uploadFiles}>上傳</button>
                            <button onClick={() => setUploadModalOpen(false)}>取消</button>
                        </div> </div></div>
            )})
            {/* 顯示說明手冊的內容 */}
            {showGuide && (
                <div style={overlayStyles} onClick={() => setShowGuide(false)}>
                    <div style={modalStylesGuide} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <h2>系統介紹</h2>
                            <p>庫存盤點系統是一個用於查詢和管理庫存商品的 Web 應用程序。通過該系統，使用者可以輕鬆查看商品信息、更新庫存數量、導出報表以及進行盤點歸檔。   </p>
                            <h2>功能概述</h2>
                            <ul style={{ textAlign: 'left' }}>
                                <li><strong>商品管理</strong>：查看所有庫存商品的詳細信息，包括商品編號、名稱、規格、庫存數量等。</li>
                                <li><strong>更新庫存數量</strong>：在數量欄位輸入新的庫存量，並支持 <code>Enter</code> 鍵以快速跳至下一個輸入框。</li>
                                <li><strong>瀏覽數據</strong>：可顯示商品的期初庫存量、進貨規格。</li>
                                <li><strong>導出數據</strong>：用戶可以匯出當前的庫存資料到 Excel 文件。</li>
                                <li><strong>歷史資料</strong>：將盤點數據保留以便月底時生成期初庫存。</li>
                            </ul>
                            <h2>如何使用</h2>
                            <ol style={{ textAlign: 'left' }}>
                                <li><p><strong>登錄系統</strong>：進入系統首頁，輸入您的用戶憑證進行登錄。</p>
                                </li>
                                <li><p><strong>查看商品規格和顯示期初庫存</strong>：</p>
                                    <ul>
                                        <li>系統將顯示商品列表，用戶可以查看各項商品的詳情。</li>
                                        <li>輕觸欲查詢商品名稱時，即可以顯示該商品的單位規格。</li>
                                        <li>輕觸欲查詢商品名稱時，即可以顯示該商品的期初庫存量。</li>

                                    </ul>
                                </li>
                                <li><p><strong>更新商品庫存</strong>：</p>
                                    <ul>
                                        <li>在數量欄位中直接輸入新的庫存數量，完成後按 <code>Enter</code> 鍵自動跳到下一個商品的數量輸入框。</li>
                                    </ul>
                                </li>
                                <li><p><strong>導出數據</strong>：</p>
                                    <ul>
                                        <li>輕觸“導出 Excel”按鈕，將當前商品庫存資料保存為 <code>.xls</code> 文件。</li>
                                    </ul>
                                </li>
                                <li><p><strong>進行盤點歸檔</strong>：</p>
                                    <ul>
                                        <li>輕觸將結束本次盤點。須驗證管理員密碼以完成歸檔。</li>
                                    </ul>
                                </li>
                            </ol>
                            <h2>多人同步功能</h2>
                            <h4>系統支持多人同時線上作業，數據將實時推送至所有用戶端使用</h4>
                            <ul style={{ textAlign: 'left' }}>
                                <li>通過 WebSocket 技術（socket.io）來實現即時數據更新。</li>
                                <li>當一名用戶更新某個商品的庫存，其他連接的用戶將會即時收到更新的通知，並可以看到最新的庫存信息。</li>
                                <li>在伺服器斷線時，系統會顯示一個覆蓋整個畫面的半透明消息，提醒用戶網絡連接問題及解決辦法，包括聯繫管理員的建議。</li>
                            </ul>
                            <h2>常見問題</h2>
                            <ol style={{ textAlign: 'left' }}>
                                <li><p><strong>我如何導出產品庫存數據？</strong></p>
                                    <ul>
                                        <li>點擊“導出 Excel”按鈕即可下載當前庫存數據。</li>
                                    </ul>
                                </li>
                                <li><p><strong>盤點歸檔時出現錯誤提示，該怎麼辦？</strong></p>
                                    <ul>
                                        <li>確保您已正確輸入所有字段，包括年份、月份和管理員密碼。</li>
                                    </ul>
                                </li>
                                <li><p><strong>為什麼我的數量更新不會被保存？</strong></p>
                                    <ul>
                                        <li>確保您在更新庫存數量後按下 <code>Enter</code> 鍵。</li>
                                    </ul>
                                </li>
                                <li><p><strong>如何查看特定商品的期初庫存？</strong></p>
                                    <ul>
                                        <li>將鼠標懸停在商品編號上，即可查看該商品的期初庫存。</li>
                                    </ul>
                                </li>
                            </ol>
                            <div>
                                <label><button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={() => setShowGuide(false)}>關閉</button></label>

                            </div>
                            <br />
                        </div>
                    </div></div>
            )}
            {/* 弹窗组件 */}
            {isModalOpen && (
                <div style={overlayStyles} onClick={() => setIsModalOpen(false)}>
                    <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
                        <div>
                            <h2>新增品项</h2>
                            <div style={{ textAlign: 'left' }}>
                                <label>商品名稱：</label><input name="商品名稱" placeholder="商品名稱" value={newProduct.商品名稱} onChange={handleInputChange} autoFocus required />
                                <br /><label>商品數量：</label><input name="數量" type="number" placeholder="盤點量" value={newProduct.數量} onChange={handleInputChange} required />
                                <br /><label>商品單位：</label><input name="單位" placeholder="單位" value={newProduct.單位} onChange={handleInputChange} />
                                <br /><label>商品校期：</label>
                                <input name="到期日" type="date" value={newProduct.到期日} onChange={handleInputChange} />
                                <div>
                                    <button onClick={handleAddProduct}>送出</button>
                                    <button onClick={() => setIsModalOpen(false)}>關閉</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
            {isArchiveModalOpen && (
                <div style={overlayStyles} onClick={() => setIsArchiveModalOpen(false)}>
                    <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
                        <div>
                            <h2>盤點歸檔</h2>
                            <label>年份：<input type="number" value={year} onChange={e => setYear(e.target.value)} min="2000" max="2100" required /></label>
                            <label>　</label>
                            <label>月份：<input type="number" value={month} onChange={e => setMonth(e.target.value)} min="1" max="12" required /></label>
                            <br />
                            <label>管理員密碼：<input style={{ width: '145px' }} type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
                            <br /><br />
                            <div>
                                <button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={handleArchiveSubmit}>存檔</button>
                                <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={() => setIsArchiveModalOpen(false)}>取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isExportModalOpen && (
                <div style={overlayStyles} onClick={() => setIsExportModalOpen(false)}>
                    <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
                        <div>
                            <h2>盤點匯出</h2>
                            <label>年份：<input type="number" value={year} onChange={e => setYear(e.target.value)} min="2000" max="2100" required /></label>
                            <label>　</label>
                            <label>月份：<input type="number" value={month} onChange={e => setMonth(e.target.value)} min="1" max="12" required /></label>

                            <br /><br />
                            <div>
                                <button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={handleExportToEpos}>EPOS上傳格式</button>
                                <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={handleExport}>一般格式</button>
                                <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={() => setIsExportModalOpen(false)}>取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 顯示離線提示框 */}
            {isUserOffline && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        textAlign: 'center'
                    }}>
                        <h2>您已離線</h2>
                        <p>請檢查網絡連線是否正常，或聯繫管理員協助處理。</p>
                        <button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={handleReconnect}>重新上線</button>
                    </div>
                </div>
            )}
            <footer style={{
                position: 'fixed',
                bottom: '0',
                left: '0',
                right: '0',
                textAlign: 'center',
                padding: '3px',
                backgroundColor: '#f5f5f5',
                borderTop: '1px solid #ccc'
            }}>
                <p style={{ margin: '0px' }}>© 2024 edc-pws.com. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;