// app.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Swal from 'sweetalert2'
import ExportModal from './components/ExportModal';
import ArchiveModal from './components/ArchiveModal';
import GuideModal from './components/GuideModal';
import Modal from './components/Modal';
import FilterModal from './components/FilterModal';
import BouncyComponent from './components/BouncyComponent';
import InventoryUploader from './components/InventoryUploader';
import { setCookie, getCookie } from './utils/cookie';
import './components/style/Modal.css'; // 導入 Modal 的 CSS 樣式
const socket = io('https://inventory.edc-pws.com'); //  連線到 Socket.IO 伺服器

const App = () => {
    // 狀態變數
    const [archivePassword, setArchivePassword] = useState(''); // 存儲歸檔密碼

    const [showFunctionButtons, setShowFunctionButtons] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [selectedLayers, setSelectedLayers] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('連線中...');
    const [showGuide, setShowGuide] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [errorModal, setErrorModal] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const cookieName = 'inventoryGuideShown';
    const [isReconnectPromptVisible, setIsReconnectPromptVisible] = useState(false);
    const inputRefs = useRef([]);
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [initialStock, setInitialStock] = useState(''); // 用於存儲期初庫存
    const [currentSpec, setCurrentSpec] = useState(''); // 用於存儲規格
    const [currentunit, setCurrentunit] = useState(''); // 用於存儲單位
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [modalContent, setModalContent] = useState({});
    const [userCount, setUserCount] = useState(0);
    const archiveModalRef = useRef();
    const inventoryUploaderRef = useRef();
    const [storeName, setStoreName] = useState('新店京站');
    const allVendors = ['全台', '央廚', '王座-備', '王座-食', '忠欣', '開元', '裕賀', '美食家', '點線麵'];
    const allLayers = ['未使用', '冷藏', '冷凍', '常温', '清潔', '備品'];
    const stores = ['台北京站', '新店京站', '信義威秀'];
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

    // 產品數據加載函數

    useEffect(() => {


        const fetchProducts = async () => {
            setLoading(true);
            await delay(500); // 等待1秒

            try {
                const response = await axios.get(`https://inventory.edc-pws.com/api/products/${storeName}`);

                if (response.status === 100) {
                    // 當未選擇商店狀況
                    setIsOffline(false); // 確保網路狀態正確
                    setLoading(false);
                } else {
                    if (response.data.length === 0) {
                        setIsOffline(false); // 確保網路狀態正確
                        setLoading(false);
                        setProducts([]);
                        Swal.fire({
                title: '錯誤',
                text: `無法盤點，因為尚未開始。`,
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: '開始盤點',
                cancelButtonText: '關閉',
            }).then((result) => {
                if (result.isConfirmed) {
                    // 選擇了 EPOS 格式
                    startInventory();
                } 
            });
                    
                    } else {
                        setProducts(response.data);
                        setIsOffline(false); // 確保網路狀態正確
                    }
                }
            } finally {
                setLoading(false);
            }
        };


        const guideShown = getCookie(cookieName); // 檢查 cookie 是否存在
        if (!guideShown) {
            // 如果 cookie 不存在，顯示說明手冊
            setTimeout(() => {
                setShowGuide(true);
                setCookie(cookieName, 'true'); // 設定 cookie，防止再顯示
            }, 1000);
        }

        if (storeName) {
            socket.emit('joinStoreRoom', storeName);
        }
        // 當 storeName 更改時，發送用戶加入房間
        // Socket.IO 事件監聽
        socket.on('updateUserCount', setUserCount);
        socket.on('productUpdated', (updatedProduct) => {
    setProducts(prevProducts => 
        prevProducts.map(product => 
            product.商品編號 === updatedProduct.商品編號 ? updatedProduct : product
        )
    );

    // 使用 SweetAlert toast 代替傳統消息
    Toast.fire({
        icon: 'success',
        title: `${updatedProduct.商品名稱} 數量變更為 ${updatedProduct.數量}`
    });
});                    
        fetchProducts(); // 調用 fetchProducts 函數`

        // 網路連線狀態監聽 (需要根據瀏覽器環境調整)
        const handleOnline = () => {
            Swal.fire('通知', '連線成功', 'success');
            setIsOffline(false);
        };
        const handleOffline = () => {
            Swal.fire('通知', '失去連線', 'warning');
            setIsOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        // 清除函式
        return () => {
            socket.off('updateUserCount', setUserCount);
            socket.off('productUpdated');
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            socket.disconnect();
        };   
    }, [storeName]);
 
const handleStoreChange = (event) => {
    const newStoreName = event.target.value;
    setStoreName(newStoreName);
    socket.emit('joinStoreRoom', newStoreName); // 加入相應的房間
};


    const startInventory = () => {
        if (inventoryUploaderRef.current) {
            inventoryUploaderRef.current.startInventory(); // 調用子組件的方法
        }
    };


    // 錯誤處理函式
    const handleError = (error, defaultMessage) => {
        const errorMessage = error.response ? error.response.data.message || error.response.data : error.message || defaultMessage;
        setErrorModal({ title: '錯誤訊息', message: errorMessage });
        setIsModalOpen(true);
    };


    const handleReconnect = () => {
        setConnectionStatus('連接成功 ✔');
        setIsUserOffline(false);
        setIsReconnectPromptVisible(false);

    };

    const handleReload = () => {
        window.location.reload(); // 重新加載頁面
        setIsModalOpen(false);
    };

    // 控制廠商篩選
    const handleVendorChange = (vendor) => {
        setSelectedVendors((prev) =>
            prev.includes(vendor) ? prev.filter(v => v !== vendor) : [...prev, vendor]
        );
    };

    // 控制庫別篩選
    const handleLayerChange = (layer) => {
        setSelectedLayers((prev) =>
            prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
        );
    };

    // 根據所選的廠商和庫別過濾產品
    const filteredProducts = products.filter(product => {
        const vendorMatch = selectedVendors.length === 0 || selectedVendors.includes(product.廠商);
        const layerMatch = selectedLayers.length === 0 || selectedLayers.includes(product.庫別);
        return vendorMatch && layerMatch;
    });
    //Enter切換下一個輸入框
    const handleKeyPress = (event, index) => {
        if (event.key === 'Enter') {
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus(); // 將焦點移到下一個輸入框
            }
        }
    };

    //下載最新數量
    const updateQuantity = async (productCode, quantity) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${storeName}/${productCode}/quantity`, { 數量: quantity });
        } catch (error) {
            console.error("更新產品時出錯:", error);
        }
    };
    //下載最新校期
    const updateExpiryDate = async (productCode, expiryDate) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${storeName}/${productCode}/expiryDate`, { 到期日: expiryDate });
        } catch (error) {
            console.error("更新到期日時出錯:", error);
        }
    };

    //上傳數量
    const handleQuantityChange = (productCode, quantity) => {
        // 輸入驗證: 確保數量為非負數
        const numQuantity = Number(quantity);
        if (isNaN(numQuantity) || numQuantity < 0) {
            alert('數量必須為非負數');
            return;
        }
        const updatedProducts = products.map(product => product.商品編號 === productCode ? { ...product, 數量: numQuantity } : product
        );
        setProducts(updatedProducts);
        updateQuantity(productCode, numQuantity);
    };

    //上傳校期
    const handleExpiryDateChange = (productCode, expiryDate) => {
        const updatedProducts = products.map(product => product.商品編號 === productCode ? { ...product, 到期日: expiryDate } : product
        );

        setProducts(updatedProducts);
        updateExpiryDate(productCode, expiryDate);
    };

    const handleMouseEnter = (product, e) => {
        setHoveredProduct(product.商品編號);
        // 直接使用 product 來設置初始庫存、規格和單位
        setInitialStock(product.期初庫存 ? `${product.期初庫存} ${product.單位}` : '查無歷史盤點紀錄');
        setCurrentSpec(product.規格 ? product.規格 : '未設定');
        setCurrentunit(product.單位 ? product.單位 : '');
        // 獲取當前鼠標位置
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({ top: e.clientY + 10, left: e.clientX + 10 });
    };

    const handleMouseLeave = () => {
        setHoveredProduct(null); // 清除懸停商品
        setInitialStock('');
        setCurrentSpec('');
        setCurrentunit('');
    };


    const openArchiveModal = () => {
        setIsArchiveModalOpen(true); // 打开模态框
    };

    const closeArchiveModal = () => {
        setIsArchiveModalOpen(false); // 关闭模态框
    };




    return (
        <>
            <div className="inventory-header">
                <div className="header-container">
                    <table className="header-table">
                        <thead>
                            <tr>
                                <td colSpan="1">
                                    <h1>庫存盤點系統</h1>
                                </td>

                                <td rowSpan="2">
                                    <select value={storeName} onChange={handleStoreChange} disabled>
                                        <option value="" disabled>請選擇門市</option>
                                        {stores.map((store, index) => (
                                            <option key={index} value={store}>{store}</option>
                                        ))}
                                    </select>
                                </td>
                                <td rowSpan="3" className="header-table.right">
                                    <button className="header-button" onClick={startInventory}>盤點開始</button>

                                    <button className="header-button" onClick={() => setShowGuide(true)}>說明</button>
                                    <button className="header-button" onClick={openArchiveModal}>歸檔</button>
                                    <button className="header-button" onClick={() => setIsExportModalOpen(true)}>匯出</button>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="0" className="header-table.left" style={{ fontSize: '1em' }}>
                                    { storeName === 'noStart' ? '檢查中...' : (isOffline ? '失去連線 ❌' : '連線成功 ✔')}&nbsp;&nbsp;|&nbsp;&nbsp;在線共&nbsp;&nbsp;<strong>{userCount}</strong>&nbsp;&nbsp;人
                                </td>
                            </tr>
                        </thead>
                    </table>

                    <hr />
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '10px', margin: '5px', overflowX: 'auto', }} >
                        <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
                            <strong>廠商</strong>：
                            <div className="list" style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', alignItems: 'flex-end' }}>

                                {allVendors.map(vendor => (
                                    <label key={vendor} className="filter-item" style={{ display: 'flex', margin: '0 6 10 8', alignItems: 'flex-top' }} >
                                        <input style={{ alignItems: 'flex-end', marginTop: '2px' }} type="checkbox" checked={selectedVendors.includes(vendor)} onChange={() => handleVendorChange(vendor)} /> {vendor}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
                            <strong>庫別</strong>：
                            <div className="list" style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', alignItems: 'flex-end' }}>

                                {['冷藏', '冷凍', '常溫', '清潔', '備品'].map(layer => (
                                    <label key={layer} className="filter-item" style={{ display: 'flex', margin: '0 6 10 8', alignItems: 'flex-top' }} >
                                        <input style={{ alignItems: 'flex-end', margin: '2 5 0 2' }} type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => handleLayerChange(layer)} /> {layer}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* 上半框架 - 廠商和庫別篩選 */}

                </div>
            </div>
            <div style={{ height: '27.7vh' }} ></div>

            {/* 下半框架 - 產品資料顯示及重載功能 */}
            <div id="product-code-bottom">

                <form autoComplete='no'>

                <table className="in-table">
                    <thead>
                        <tr>
                            <th id="編號" className="in-th">商品編號</th>
                            <th className="in-th">商品名稱</th>
                            <th className="in-th">數量</th>
                            <th id="單位" className="in-th">單位</th>
                            <th className="in-th">到期日</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product, index) => (
                            product.庫別 !== '未使用' && (
                                <tr key={product.商品編號}>
                                    <td id="編號" className="in-td">{product.商品編號}</td>
                                    <td id="品名" className="in-td" onMouseEnter={(e) => handleMouseEnter(product, e)} onMouseLeave={handleMouseLeave}>{product.商品名稱}</td>
                                    <td id="數量-行" className="in-td" style={{ width: '80px' }}><label><input input className="input-number" name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyPress={event => handleKeyPress(event, index)} ref={el => inputRefs.current[index] = el} required /> &nbsp;&nbsp;{product.單位}</label></td>
                                    <td id="數量-固" className="in-td"><input className="input-number" name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyPress={event => handleKeyPress(event, index)} ref={el => inputRefs.current[index] = el} required /></td>
                                    <td id="單位" className="in-td">{product.單位}</td>
                                    <td id="校期" className="in-td"><input className='date' type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} /*disabled={disabledVendors.includes(product.廠商)} */ /></td>
                                </tr>
                            )))}
                    </tbody>
                </table>
                </form>
            </div>

            {/* 其他 Modal 與提示框 */}
            {/* <InventoryUploader isOpen={isInventoryUploaderOpen} onClose={() => setIsInventoryUploaderOpen(false)} products = { products } setProducts = { setProducts } />*/}
            <InventoryUploader ref={inventoryUploaderRef} storeName={storeName} /> {/* 傳遞 storeName 給 InventoryUploader */}
            {/* 儲存歷史商品資料 */}

            
                {/* 使用 SweetAlert2 獲取密碼後打開 ArchiveModal */}
            <ArchiveModal 
                isOpen={isArchiveModalOpen} 
                onClose={closeArchiveModal} 
                products={products} 
                storeName={storeName} 
            />

            <ExportModal 
    isOpen={isExportModalOpen} 
    onClose={() => setIsExportModalOpen(false)} 
    products={products} 
/>
            <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />}
            {/* 顯示工具提示 */}
            {hoveredProduct && (<div style={{ textAlign: 'left', fontSize: '12px', position: 'fixed', backgroundColor: 'white', border: '1px solid #ccc', padding: '5px', borderRadius: '5px', zIndex: 1000, top: tooltipPosition.top, left: tooltipPosition.left, }}>
                期初存量：{initialStock} <br />
                規格：{currentSpec}
            </div>
            )}
            {/* 顯示載入提示*/}
            {loading && (
                <div><BouncyComponent />
                </div>

            )} 
            <Modal
                isOpen={isModalOpen}
                title={modalContent.title}
                message={modalContent.message}
                type={modalContent.type}
                onClose={() => setIsModalOpen(false)}
            />
            {/* 顯示錯誤訊息的 Modal */}
            {errorModal && (
                <Modal
                    isOpen={!!errorModal}
                    title={errorModal.title}
                    message={errorModal.message}
                    onClose={() => setErrorModal(null)}
                    type="error"
                />
            )}
            {/* 顯示離線提示 */}
            {isOffline && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                        <h2>您已離線</h2>
                        <p>請檢查網路連線是否正常。</p>
                        <button onClick={() => window.location.reload()}>重新整理</button>
                    </div>
                </div>

            )
            }

            {/* 閒置提示框，顯示重新上線按鈕 */}
            {
                isReconnectPromptVisible && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, }}>
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                            <h2>閒置中斷線</h2>
                            <p>您已閒置超過10分鐘，請重新連接。</p>
                            <button onClick={handleReconnect}>重新上線</button>
                        </div>
                    </div>
                )
            }
            <footer style={{ position: 'fixed', bottom: '0', left: '0', right: '0', textAlign: 'center', padding: '3px', backgroundColor: '#f5f5f5', borderTop: '1px solid #ccc' }}>
                <p style={{ margin: '0px' }}>© 2024 edc-pws.com. All rights reserved.</p>
            </footer>
        </>

    );
};

export default App;
