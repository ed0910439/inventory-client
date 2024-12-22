import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import ExportModal from './components/ExportModal';
import NewProductModal from './components/NewProductModal';
import ArchiveModal from './components/ArchiveModal';
import GuideModal from './components/GuideModal';
import Modal from './components/Modal';
import BouncyComponent from './BouncyComponent';
import InventoryUploader from './components/InventoryUploader';
import { setCookie, getCookie } from './utils/cookie';

const socket = io('https://inventory.edc-pws.com'); //  連線到 Socket.IO 伺服器

const App = () => {
    // 狀態變數
    const [showFunctionButtons, setShowFunctionButtons] = useState(false);
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialStockData, setInitialStockData] = useState({});
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [selectedLayers, setSelectedLayers] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('連線中...'); // 初始狀態改為連線中
    const [showGuide, setShowGuide] = useState(false);
    const [isOffline, setIsOffline] = useState(false); // 使用更簡潔的變數名稱
    const [errorModal, setErrorModal] = useState(null); // 顯示錯誤訊息的 Modal
    const [modalContent, setModalContent] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [initialStock, setInitialStock] = useState('');
    const [currentSpec, setCurrentSpec] = useState('');
    const [currentunit, setCurrentunit] = useState('');
    const inputRefs = useRef([]);
    const [userCount, setUserCount] = useState(0);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const cookieName = 'inventoryGuideShown';
    const inventoryUploaderRef = useRef();
    const localVersion = '1.0.7';
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isReconnectPromptVisible, setIsReconnectPromptVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [actionTonfirm, setActionToConfirm] = useState(null); // 'clearQuantities' 或 'clearExpiryDates'
    const [isInventoryUploaderOpen, setIsInventoryUploaderOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [storeName, setStoreName] = useState('noStart');
    const allVendors = ['全台', '央廚', '王座-備', '王座-食', '忠欣', '開元', '裕賀', '美食家', '點線麵'];
    const allLayers = ['未使用', '冷藏', '冷凍', '常溫', '清潔', '備品'];
    const stores = ['台北京站', '新店京站', '信義威秀']; // 預定義的門市列表
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`https://inventory.edc-pws.com/api/products/${storeName}`);
                if (response.status === 204) {
                    setLoading(false);
                    setIsOffline(false);
                    return;
                } else {
                    setProducts(response.data);
                    setConnectionStatus('連接成功 ✔');
                    setLoading(false);
                    setIsOffline(false); // 網路連線成功，更新離線狀態
                }
            } catch (error) {
                handleError(error, '取得產品失敗'); // 使用新的錯誤處理函式
                setConnectionStatus('失去連線 ❌');
                setIsOffline(true); // 網路連線失敗，更新離線狀態
            } finally {
                setLoading(false);
            }
        };

        const guideShown = getCookie(cookieName);
        if (!guideShown) { // 如果 cookie 不存在
            // 設定一個延遲，確保元件完全載入後再顯示說明手冊
            setTimeout(() => {
                setShowGuide(true); // 顯示說明手冊
                setCookie(cookieName, cookieValue); // 設定 cookie，下次就不會再顯示
            }, 1000); // 延遲 1 秒 (可根據需要調整)
        }


        fetchProducts();

        // Socket.IO 事件監聽
        socket.on('updateUserCount', setUserCount);
        socket.on('productUpdated', (updatedProduct) => {
            setProducts(prevProducts => prevProducts.map(product => product.商品編號 === updatedProduct.商品編號 ? updatedProduct : product
            ));
            setNewMessage(`${updatedProduct.商品名稱} 數量變更為 ${updatedProduct.數量}`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
        });

        // 網路連線狀態監聽 (需要根據瀏覽器環境調整)
        const handleOnline = () => {
            setConnectionStatus('連線成功 ✔');
            setIsOffline(false);

        };
        const handleOffline = () => {
            setConnectionStatus('失去連線 ❌');
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
    }, []);

    const handleStoreChange = (event) => {
        setStoreName(event.target.value); // 更新已選擇的門市名稱
    };

    const startInventory = () => {
        // 要先確認 storeName 是否有值
        if (!storeName) {
            alert('請選擇門市！'); // 將儲存改為直接提示用戶
            return;
        }

        if (inventoryUploaderRef.current) {
            inventoryUploaderRef.current.startInventory(); // 調用子組件的方法
        }
    };


    const handleProductSubmit = (productDetails) => {
        axios.post('/api/updateProduct', productDetails)
            .then(response => {
                console.log('更新成功:', response.data);
                setIsModalOpen(false);
                setProducts(products.filter(p => p.商品編號 !== productDetails.商品編號));
            })
            .catch(error => {
                console.error('更新失敗:', error);
            });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
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
    const handleBlur = () => {
        setHoveredProduct(null);
        setInitialStock('');
    };
    // 控制廠商篩選
    const handleVendorChange = (vendor) => {
        setSelectedVendors((prev) => prev.includes(vendor) ? prev.filter(v => v !== vendor) : [...prev, vendor]
        );
    };

    // 控制溫層篩選
    const handleLayerChange = (layer) => {
        setSelectedLayers((prev) => prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
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

    //下載最新數量
    const updateQuantity = async (productCode, quantity) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/quantity/${storeName}`, { 數量: quantity });
        } catch (error) {
            console.error("更新產品時出錯:", error);
        }
    };
    //下載最新校期
    const updateExpiryDate = async (productCode, expiryDate) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/expiryDate/${storeName}`, { 到期日: expiryDate });
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
        const initialStockItem = initialStockData[product.商品編號];
        setInitialStock(initialStockItem ? initialStockItem.數量 : 0);
        setCurrentSpec(initialStockItem ? initialStockItem.規格 : '未設定');
        setCurrentunit(initialStockItem ? initialStockItem.單位 : '');
        const rect = e.currentTarget.getBoundingClientRect(); // 獲取當前商品行的邊界

        setTooltipPosition({ top: e.clientY + 10, left: e.clientX + 10 }); // 更新工具提示位置
    };

    const handleMouseLeave = () => {
        setHoveredProduct(null); // 清除懸停商品
        setInitialStock(''); // 清除期初庫存數據
        setCurrentSpec(''); // 清除規格數據
        setCurrentunit(''); // 清除單位數據
    };

    const toggleFunctionButtons = () => {
        setShowFunctionButtons(prev => !prev); // 切換當前狀態
    };

    //一鍵刪除貨量
    const handleClearQuantities = () => {
        const updatedProducts = products.map(product => ({
            ...product,
            數量: 0 // 將所有數量設置為 0
        }));
        setProducts(updatedProducts);

        // 發送請求到後端更新數據庫
        products.forEach(product => {
            handleQuantityChange(product.商品編號, 0); // 假設 updateQuantity 函數被定義為更新數量
        });
    };
    //一鍵刪除日期
    const handleClearExpiryDates = () => {
        const updatedProducts = products.map(product => ({
            ...product,
            到期日: '' // 將所有到期日設置為 null
        }));
        setProducts(updatedProducts);

        // 發送請求到後端更新數據庫：
        products.forEach(product => {
            handleExpiryDateChange(product.商品編號, ''); // 假設 updateExpiryDate 函數被定義為更新到期日
        });
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
    // 顯示錯誤訊息的 Modal
    const ErrorModal = ({ title, message }) => (
        <Modal isOpen={!!errorModal} title={title} message={message} onClose={() => setErrorModal(null)} type="error" />
    );
    return (
        <>
            {/* 固定的標題區域 */}
            <div className="inventory-header">
                <div className="fixed-header">
                    <div className="header-container">
                        <table className="header-table">
                            <thead>
                                <tr>
                                    <td colSpan="2">
                                        <h1>庫存盤點系統</h1>
                                        <div>
                                            <select value={storeName} onChange={handleStoreChange}>
                                                {stores.map((store, index) => (
                                                    <option key={index} value={store}>{store}</option>
                                                ))}
                                            </select>

                                        </div>
                                    </td>
                                    <td rowSpan="2" className="header-table.right">
                                        <button className="header-button" onClick={() => setShowGuide(true)}>說明</button>
                                        <button className="header-button" onClick={startInventory}>盤點開始</button>
                                        <button className="header-button" onClick={() => setIsNewProductModalOpen(true)}>新增</button>
                                        <button id="butter-code" className="header-button" onClick={() => setIsFilterModalOpen(true)}>篩選</button>
                                        <button className="header-button" onClick={() => setIsArchiveModalOpen(true)}>歸檔</button>
                                        <button className="header-button" onClick={() => setIsExportModalOpen(true)}>匯出</button>
                                        <br />
                                        <button onClick={toggleFunctionButtons}>更多功能</button>

                                        {showFunctionButtons && (
                                            <>
                                                <button onClick={handleClearQuantities}>數量清除</button>
                                                <button onClick={handleClearExpiryDates}>到期日清除</button>
                                            </>
                                        )}


                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="header-table.left" style={{ fontSize: '1em' }}>
                                        {connectionStatus}&nbsp;&nbsp;|&nbsp;&nbsp;在線共&nbsp;&nbsp;<strong>{userCount}</strong>&nbsp;&nbsp;人&nbsp;&nbsp;|&nbsp;&nbsp;<strong>{localVersion}</strong>
                                    </td>
                                </tr>
                            </thead>
                        </table>

                        <div id="product-code">
                            <hr />
                            <div style={{ valign: 'top', textAlign: 'left', padding: '10', margin: '5' }}>
                                <label>　　　<strong>廠商</strong>：</label>
                                {allVendors.map(vendor => (
                                    <label key={vendor} className="filter-item">
                                        <input type="checkbox" checked={selectedVendors.includes(vendor)} onChange={() => handleVendorChange(vendor)} />
                                        {vendor}
                                    </label>
                                ))}<br />
                                <label>　　　<strong>庫別</strong>：</label>
                                {['冷藏', '冷凍', '常溫', '清潔', '備品'].map(layer => (
                                    <label key={layer} className="filter-item">
                                        <input type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => handleLayerChange(layer)} />
                                        {layer}
                                    </label>
                                ))}</div>
                        </div>

                    </div>
                </div>
            </div>
            <div id="product-code">
                <br />
                <br />
                <br />
            </div>
            <br />
            <br />
            <br />
            <br />
            <br />
            {/* 固定的表頭 */}
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
                                <td id="數量-行" className="in-td" style={{ width: '80px' }}><label><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyPress={event => handleKeyPress(event, index)} ref={el => inputRefs.current[index] = el} required /> &nbsp;&nbsp;{product.單位}</label></td>
                                <td id="數量-固" className="in-td"><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyPress={event => handleKeyPress(event, index)} ref={el => inputRefs.current[index] = el} required /></td>
                                <td id="單位" className="in-td">{product.單位}</td>
                                <td id="校期" className="in-td"><input className='date' type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} /*disabled={disabledVendors.includes(product.廠商)} */ /></td>
                            </tr>
                        )))}
                </tbody>
            </table>


            {isFilterModalOpen && (
                <>
                    <div className="modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
                        <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>

                            <table className="table" style={{ margin: 5 }}>
                                <tbody>
                                    <tr>
                                        <th style={{ width: '80px', padding: '10', margin: '5' }}><h2>廠商</h2></th>
                                        <th style={{ width: '80px', padding: '10', margin: '5' }}><h2>溫層</h2></th>
                                    </tr>
                                    <tr>
                                        <td style={{ valign: 'top', textAlign: 'left', padding: '10', margin: '5' }}>
                                            {allVendors.map(vendor => (
                                                <li className="li"><label key={vendor} className="filter-item">
                                                    <input type="checkbox" checked={selectedVendors.includes(vendor)} onChange={() => handleVendorChange(vendor)} />
                                                    {vendor}
                                                </label></li>
                                            ))}</td>
                                        <td style={{ valign: 'top', textAlign: 'left', padding: '10', margin: '5' }}>
                                            {['冷藏', '冷凍', '常溫', '清潔', '備品'].map(layer => (
                                                <li className="li"><label key={layer} className="filter-item">
                                                    <input type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => handleLayerChange(layer)} />
                                                    {layer}
                                                </label></li>
                                            ))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                    <button onClick={setIsFilterModalOpen(false)}>關閉</button>
                </>
            )}

            {/* 載入提示 */}
            {loading && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div>
                        <BouncyComponent />
                    </div>
                </div>
            )}
            {/* 顯示工具提示 */}
            {hoveredProduct && (<div style={{ textAlign: 'left', fontSize: '12px', position: 'fixed', backgroundColor: 'white', border: '1px solid #ccc', padding: '5px', borderRadius: '5px', zIndex: 1000, top: tooltipPosition.top, left: tooltipPosition.left, }}>
                期初庫存量：{products.期初庫存}{currentunit}<br />
                規格：{currentSpec} {/* 顯示規格 */}</div>
            )}

            {/* <InventoryUploader isOpen={isInventoryUploaderOpen} onClose={() => setIsInventoryUploaderOpen(false)} products = { products } setProducts = { setProducts } />*/}
            <InventoryUploader ref={inventoryUploaderRef} storeName={storeName} /> {/* 傳遞 storeName 給 InventoryUploader */}

            {/* 短暫提示 */}
            {showToast && (<div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#4caf50', color: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)', zIndex: 1000, }}> {newMessage} </div>
            )}
            {/* 使用NewProductModal */}
            <NewProductModal isOpen={isNewProductModalOpen} onClose={() => setIsNewProductModalOpen(false)} products={products} setProducts={setProducts} />

            {/* 使用ArchiveModal */}
            <ArchiveModal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} products={products} />

            {/* 使用ExportModal */}
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} products={products} />


            {/* 使用GuideModal */}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

            <Modal isOpen={isModalOpen} title={modalContent.title} message={modalContent.message} onClose={() => setIsModalOpen(false)} type={modalContent.type} />
            {/* 新版本 */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{modalContent.title}</h2>
                        <p>{modalContent.message}</p>
                        <button onClick={handleOnline}>重整頁面</button>
                    </div>
                </div>
            )}



            <ErrorModal title={errorModal?.title} message={errorModal?.message} /> {/* 顯示錯誤訊息 Modal */}


            {/* 顯示離線提示 */}
            {isOffline && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                        <h2>您已離線</h2>
                        <p>請檢查網路連線是否正常。</p>
                        <button onClick={() => window.location.reload()}>重新整理</button>
                    </div>
                </div>

            )}

            {/* 閒置提示框，顯示重新上線按鈕 */}
            {isReconnectPromptVisible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                        <h2>閒置中斷線</h2>
                        <p>您已閒置超過10分鐘，請重新連接。</p>
                        <button onClick={handleReconnect}>重新上線</button>
                    </div>
                </div>
            )}
            <footer style={{ position: 'fixed', bottom: '0', left: '0', right: '0', textAlign: 'center', padding: '3px', backgroundColor: '#f5f5f5', borderTop: '1px solid #ccc' }}>
                <p style={{ margin: '0px' }}>© 2024 edc-pws.com. All rights reserved.</p>
            </footer>

        </>
    );
};
export default App;
