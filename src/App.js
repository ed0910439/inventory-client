//App.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
//import { saveAs } from 'file-saver';
//import ExcelJS from 'exceljs';
import io from 'socket.io-client';
import ExportModal from './components/ExportModal';
import ProductModal from './components/ProductModal';
import ArchiveModal from './components/ArchiveModal';
import GuideModal from './components/GuideModal';
import Modal from './components/Modal'; // 確保引入你的 Modal 組件
import BouncyComponent from './BouncyComponent';
import StartInventory from './components/StartInventory';


const socket = io('https://inventory.edc-pws.com'); // 根据需要可能更改

// 样式定義
const App = () => {
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
//    const [latestVersion, setLatestVersion] = useState(null);
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
    const [modalContent, setModalContent] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState(null); // 懸停的商品編號
    const [initialStock, setInitialStock] = useState(''); // 用於顯示期初庫存量
    const [currentSpec, setCurrentSpec] = useState(''); // 用於顯示規格
//    const [showOfflineWarning, setShowOfflineWarning] = useState(false);
//    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const inputRefs = useRef([]); // 用於儲存每個輸入框的引用
    const [socketId, setSocketId] = useState('');
    const filterRef = useRef(null);
    const allVendors = ['全台', '央廚', '王座', '王座-食', '忠欣', '開元', '裕賀', '美食家', '點線麵']; // 所有廠商
    const disabledVendors = useState(['忠欣', '王座']); // 例如，禁用 '全台' 和 '央廚' 廠商的到期日輸入

//    const [year, setYear] = useState('');
//    const [month, setMonth] = useState('');
    const [userCount, setUserCount] = useState(0); // 用於存儲線上人數
//    const [initialUnit, setInitialUnit] = useState(''); // 用於存儲期初庫存量
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 }); // 記錄工具提示的位置
//    const [password, setPassword] = useState('');
//   const [modalVisible, setModalVisible] = useState(false);
    const [isStartInventoryOpen, setIsStartInventoryOpen] = useState(false);
 //   const [isFilterVisible, setIsFilterVisible] = useState(false);
    const setUploadModalOpen = useState(false);
/*    const [files, setFiles] = useState({
        stock: null,
        currentMonth: null,
        initialStock: null,
        finalStock: null,
        outTransfer: null,
        inTransfer: null,
    });*/
    
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true); // 開始載入，設置狀態

            try {
                const response = await axios.get(`https://inventory.edc-pws.com/api/products`);
                setProducts(response.data);
                setConnectionStatus('連接成功 ✔');
                setLoading(false); // 載入完成，更新狀態
                setSocketId(socket.id); // 設置 socket id 到狀態中

            } catch (error) {
                console.error("取得產品時出錯:", error.response ? error.response.data : error.message);
                setConnectionStatus('失去連線 ❌');


            }
        };
        const fetchVersion = async () => {
            try {
                const response = await axios.get('./version.json'); // 獲取最新版本號
                const serverVersion = response.data.version;
                const localVersion = '1.0.5'; // 當前應用版本號
                if (serverVersion !== localVersion) {
                    setModalContent({
                        title: '版本更新',
                        message: '有新版本可用！請將頁面重新整理！',
                        type: 'warning', // 或 `success` 根據需要調整
                    });
                    setIsModalOpen(true);
                }
            } catch (error) {
                console.error('取得版本更新失敗:', error);
                setModalContent({
                    title: '錯誤',
                    message: '無法獲取版本更新訊息。',
                    type: 'error',
                });
                // setIsModalOpen(true);   

            }
        };
        const fetchInitialStockData = async () => {
            try {
                const response = await axios.get(`https://inventory.edc-pws.com/archive/originaldata`);
                const initialStockMap = {};
                response.data.forEach(item => {
                    initialStockMap[item.商品編號] = item.數量; // 儲存成物件以便查詢
                });
                setInitialStockData(initialStockMap);
            } catch (error) {
                console.error("獲取期初庫存數據時出錯:", error);
            }
        };
        fetchInitialStockData();
        fetchProducts();
        fetchVersion();


        // 監聽連接的用戶數更新
        socket.on('updateUserCount', (count) => {
            setUserCount(count);
        });

        socket.on('productUpdated', (updatedProduct) => {
            setProducts(prevProducts =>
                prevProducts.map(product =>
                    product.商品編號 === updatedProduct.商品編號 ? updatedProduct : product
                )
            );
            if ({ socketId } !== socket.id) {            // 顯示新數據的位置提示
                setNewMessage(`使用者: ${socket.id} 修改 ${updatedProduct.商品編號}-${updatedProduct.商品名稱} 數量為  ${updatedProduct.數量}`);
                setShowToast(true);

                setTimeout(() => {
                    setShowToast(false);
                }, 4000);
            }
        });


        let timer;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                socket.disconnect(); // 確保在計時器到期時斷開連接
                setConnectionStatus('失去連線 ❌');
                setIsUserOffline(true);
            }, idleTimeout); // 使用閒置時間
        };

        // 註冊用戶活動事件來重置計時器
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);

        socket.on('connect', () => {
            resetTimer();
            setConnectionStatus('連接成功 ✔');
            setIsUserOffline(false);
        });

        resetTimer(); // 初始重置計時器

        // 在组件卸載時清理事件监听
        return () => {
            clearTimeout(timer);
            socket.off('連接成功');
            socket.off('失去連線');
            socket.off('productUpdated');
            socket.off('updateUserCount');
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            socket.disconnect();
            socket.off('connect');
        };
    }, [socketId]);

    const handleReconnect = () => {
        socket.connect(); // 重新連接socket
        setConnectionStatus('連接成功 ✔');
        setIsUserOffline(false);
    };

    /*const handleBlur = () => {
        setHoveredProduct(null);
        setInitialStock('');
    };*/
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
        if (quantity < 0) { alert("數量不能為負。"); return; } const updatedProducts = products.map(product =>
            product.商品編號 === productCode ? { ...product, 數量: quantity } : product
        );

        setProducts(updatedProducts);
        updateQuantity(productCode, quantity);
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
        const isExpiryDisabled = disabledVendors.includes(product.廠商);
        setHoveredProduct({ ...product, isExpiryDisabled }); // 將 isExpiryDisabled 屬性加入 hoveredProduct 物件
        setInitialStock(initialStockData[product.商品編號] || '未設定'); // 查找對應的期初庫存
        setCurrentSpec(product.規格); // 設置當前商品的規格
        //const rect = e.currentTarget.getBoundingClientRect(); // 獲取當前商品行的邊界

        setTooltipPosition({ top: e.clientY + 10, left: e.clientX + 10 }); // 更新工具提示位置
    };

    const handleMouseLeave = () => {
        setHoveredProduct(null); // 清除懸停商品
        setInitialStock(''); // 清除期初庫存數據
        setCurrentSpec(''); // 清除規格數據
    };
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
                                    <td colSpan="2" className="header-table.left" style={{ fontSize: '1em'}}>
                                    {connectionStatus} | 在線共<strong>{userCount}</strong>人
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
                <table  className="in-table">
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
                                    <td id="product-code"  className="in-td">{product.單位}</td>
                                    <td className="in-td"><input className='date' type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} disabled={disabledVendors.includes(product.廠商)} /></td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            
  
            {isFilterModalOpen && (
                <div className="modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>
                        <div ref={filterRef} > {/*移除 style */}
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
                期初庫存量：{initialStock}<br />
                規格：{currentSpec} {/* 顯示規格 */}</div>
            )}
            {/* 短暫提示 */}
            {showToast && (<div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#4caf50', color: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)', zIndex: 1000, }}> {newMessage} </div>
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

            


            {/* 顯示離線提示框 */}
            {isUserOffline && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                        <h2>您已離線</h2>
                        <p>請檢查網絡連線是否正常，或聯繫管理員協助處理。</p>
                        <button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={handleReconnect}>重新上線</button>
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