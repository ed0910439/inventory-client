import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import io from 'socket.io-client';
import ExportModal from './components/ExportModal';
import ProductModal from './components/ProductModal';
import ArchiveModal from './components/ArchiveModal';
import GuideModal from './components/GuideModal';
import Modal from './components/Modal';
import BouncyComponent from './BouncyComponent';
import StartInventory from './components/StartInventory';
import { setCookie, getCookie } from './utils/cookie';

const socket = io('https://inventory.edc-pws.com'); //  連線到 Socket.IO 伺服器

const App = () => {
    // 狀態變數
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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
    const allVendors = ['全台', '央廚', '王座', '王座-食', '忠欣', '開元', '裕賀', '美食家', '點線麵'];
    const [disabledVendors, setDisabledVendors] = useState(['忠欣', '王座']);
    const [userCount, setUserCount] = useState(0);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [files, setFiles] = useState({ /* ... */ });
    const cookieName = 'inventoryGuideShown';
    const localVersion = '1.0.6';
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isStartInventoryOpen, setIsStartInventoryOpen] = useState(false);
    const [isReconnectPromptVisible, setIsReconnectPromptVisible] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await axios.get('https://inventory.edc-pws.com/api/products');
                setProducts(response.data);
                setConnectionStatus('連接成功 ✔');
                setLoading(false);
                setIsOffline(false); // 網路連線成功，更新離線狀態
            } catch (error) {
                handleError(error, '取得產品失敗'); // 使用新的錯誤處理函式
                setConnectionStatus('失去連線 ❌');
                setIsOffline(true); // 網路連線失敗，更新離線狀態
            } finally {
                setLoading(false);
            }
        };

        const guideShown = getCookie(cookieName);
        if (!guideShown) {  // 如果 cookie 不存在
            // 設定一個延遲，確保元件完全載入後再顯示說明手冊
            setTimeout(() => {
                setShowGuide(true); // 顯示說明手冊
                setCookie(cookieName, cookieValue); // 設定 cookie，下次就不會再顯示
            }, 1000); // 延遲 1 秒 (可根據需要調整)
        }


        const fetchVersion = async () => {
            try {
                const response = await fetch('/version.json'); // 獲取最新版本號
                const data = await response.json();
                const serverVersion = data.version;


                if (serverVersion !== localVersion) {
                    setModalContent({
                        title: '版本更新',
                        message: '有新版本可用！請將頁面重新整理！',
                        type: 'warning', // 可以根據需要進行調整
                    });
                    setIsModalOpen(true);
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
                    initialStockMap[item.商品編號] = {
                        數量: item.數量,
                        規格: item.規格,
                        單位: item.單位
                    };
                });
                setInitialStockData(initialStockMap);
            } catch (error) {
                handleError(error, "獲取期初庫存數據失敗");
            }
        
        };
        fetchInitialStockData();
        fetchProducts();
        fetchVersion();


        // Socket.IO 事件監聽
        socket.on('updateUserCount', setUserCount);
        socket.on('productUpdated', (updatedProduct) => {
            setProducts(prevProducts => prevProducts.map(product =>
                product.商品編號 === updatedProduct.商品編號 ? updatedProduct : product
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

    };
    const handleBlur = () => {
        setHoveredProduct(null);
        setInitialStock('');
}
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
	//下載最新數量
	const updateQuantity = async (productCode, quantity) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/quantity`, { 數量: quantity });
        } catch (error) {
            console.error("更新產品時出錯:", error);
        }
    };
	//下載最新校期
    const updateExpiryDate = async (productCode, expiryDate) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/expiryDate`, { 到期日: expiryDate });
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
        const updatedProducts = products.map(product =>
            product.商品編號 === productCode ? { ...product, 數量: numQuantity } : product
        );
        setProducts(updatedProducts);
        updateQuantity(productCode, numQuantity);
    };
	//上傳校期
    const handleExpiryDateChange = (productCode, expiryDate) => {
        const updatedProducts = products.map(product =>
            product.商品編號 === productCode ? { ...product, 到期日: expiryDate } : product
        );

        setProducts(updatedProducts);
        updateExpiryDate(productCode, expiryDate);
    };


    const handleMouseEnter = (product, e) => {
        setHoveredProduct(product.商品編號);
        const initialStockItem = initialStockData[product.商品編號];
        setInitialStock(initialStockItem ? initialStockItem.數量 : 0 );
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
    )
    return (
        <>
            {/* 固定的標題區域 */}
            <div className="inventory-header">
                <div className="fixed-header">
                    <div className="header-container">
                        <table className="header-table">
                            <thead>
                                <tr>
                                    <td colSpan="2" >
                                        <h1 >庫存盤點系統</h1>
                                    </td>
                                    <td rowSpan="2" className="header-table.right">
                                        <button className="header-button" onClick={() => setShowGuide(true)}>說明</button>
                                        <button className="header-button" onClick={() => setIsArchiveModalOpen(true)}>歸檔</button>
                                        <button className="header-button" onClick={() => setIsProductModalOpen(true)}>缺漏</button>
                                        <br />
                                        <button className="header-button" onClick={() => setIsExportModalOpen(true)}>匯出</button>
                                        <button id="butter-code" className="header-button" onClick={() => setIsFilterModalOpen(true)}>篩選</button>
                                        <button className="header-button" onClick={() => setUploadModalOpen(true)}>匯總報表</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="header-table.left" style={{ fontSize: '1em' }}>
                                        {connectionStatus}&nbsp;&nbsp;|&nbsp;&nbsp;在線共&nbsp;&nbsp;<strong>{userCount}</strong>&nbsp;&nbsp;人&nbsp;&nbsp;|&nbsp;&nbsp;<strong>{localVersion}</strong>
                                    </td>
                                </tr>    </thead>
                        </table>

                        <div id="product-code" >
                            <hr />
                            <div style={{ valign: 'top', textAlign: 'left', padding: '10', margin: '5' }}>
                                <label>　　　<strong>廠商</strong>：</label>
                                {allVendors.map(vendor => (
                                    <label key={vendor} className="filter-item">
                                        <input type="checkbox" checked={selectedVendors.includes(vendor)} onChange={() => handleVendorChange(vendor)} />
                                        {vendor}
                                    </label>
                                ))}<br />
                                <label>　　　<strong>溫層</strong>：</label>
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
            <div id="product-code" >
                <br />
                <br />                <br />
            </div>
            <br />
            <br />
            <br />
            <br />
            {/* 固定的表頭 */}
            <table className="in-table">
                <thead>
                    <tr>
                        <th id="product-code" className="in-th">商品編號</th>
                        <th className="in-th">商品名稱</th>
                        <th className="in-th">數量</th>
                        <th id="product-code" className="in-th">單位</th>
                        <th className="in-th">到期日</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredProducts.map((product, index) => (
                        product.廠商 !== '#N/A' && (
                            <tr key={product.商品編號}>
                                <td id="product-code" className="in-td">{product.商品編號}</td>
                                <td className="in-td" id="name" onMouseEnter={(e) => handleMouseEnter(product, e)} onMouseLeave={handleMouseLeave}>{product.商品名稱}</td>
                                <td id="butter-code" className="in-td" style={{ width: '80px' }}><label><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyDown={(e) => handleKeyPress(e, index)} data-index={index} required /> &nbsp;&nbsp;{product.單位}</label></td>
                                <td id="product-code" className="in-td"><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyDown={(e) => handleKeyPress(e, index)} data-index={index} required /></td>
                                <td id="product-code" className="in-td">{product.單位}</td>
                                <td className="in-td"><input className='date' type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} disabled={disabledVendors.includes(product.廠商)} /></td>
                            </tr>
                        )))}
                </tbody>
            </table>


            {isFilterModalOpen && (
                <div className="modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>
                        <div ref={filterRef} > {/*移除 style */}
                            <div className="fixed-header">
                                <div className="header-container">
                                    <table className="header-table" style={{ margin: 5 }}>
                                        <tbody >
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
                            </div>                        </div>
                    </div>
                </div>
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
                期初庫存量：{initialStock}{currentunit}<br />
                規格：{currentSpec} {/* 顯示規格 */}</div>
            )}
            {/* 短暫提示 */}
            {showToast && (<div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#4caf50', color: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)', zIndex: 1000, }}> {newMessage} </div>
            )}
            {/* 使用ProductModal */}
            <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} products={products} setProducts={setProducts} />

            {/* 使用ArchiveModal */}
            <ArchiveModal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} products={products} />

            {/* 使用ExportModal */}
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} products={products} />

            {/* 使用StartInventory */}
            <StartInventory isOpen={isStartInventoryOpen} onClose={() => setIsStartInventoryOpen(false)} products={products} />

            {/* 使用GuideModal */}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

            <Modal isOpen={isModalOpen} title={modalContent.title} message={modalContent.message} onClose={() => setIsModalOpen(false)} type={modalContent.type} />
            {/* 新版本 */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{modalContent.title}</h2>
                        <p>{modalContent.message}</p>
                        <button onClick={handleReload}>重整頁面</button>
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