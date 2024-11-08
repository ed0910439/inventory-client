//App.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import io from 'socket.io-client';
import ExportModal  from './components/ExportModal';
import ProductModal  from './components/ProductModal';
import ArchiveModal  from './components/ArchiveModal';
import GuideModal  from './components/GuideModal';
import Modal from './components/Modal'; // 確保引入你的 Modal 組件
import BouncyComponent from './BouncyComponent';


const socket = io('https://inventory.edc-pws.com'); // 根据需要可能更改

// 样式定义
const App = () => {
	const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [latestVersion, setLatestVersion] = useState(null);
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
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState(null); // 懸停的商品編號
    const [initialStock, setInitialStock] = useState(''); // 用於顯示期初庫存量
    const [currentSpec, setCurrentSpec] = useState(''); // 用於顯示規格
    const [showOfflineWarning, setShowOfflineWarning] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const inputRefs = useRef([]); // 用於儲存每個輸入框的引用
    const [socketId, setSocketId] = useState('');

    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [userCount, setUserCount] = useState(0); // 用於存儲線上人數
    const [initialUnit, setInitialUnit] = useState(''); // 用於存儲期初庫存量
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 }); // 記錄工具提示的位置
    const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

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
				setSocketId(socket.id); // 設置 socket id 到狀態中

            } catch (error) {
                console.error("取得產品時出錯:", error.response ? error.response.data : error.message);
                setConnectionStatus('失去連線 ❌');


            }
        };
        const fetchVersion = async () => {
            try {
                const response = await axios.get('https://inventory.edc-pws.com/api/version'); // 獲取最新版本號
                const serverVersion = response.data.version;
                const localVersion = '1.0.4'; // 當前應用版本號
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
            setIsModalOpen(true);
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
			if ({socketId} !== socket.id){            // 顯示新數據的位置提示
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
                setConnectionStatus('失去連線 ❌');
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
			socket.disconnect();
        };
    }, []);

    const handleReconnect = () => {
        setConnectionStatus('連接成功 ✔');
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
	<>
            <header>

            {/* 導航條 */}
            <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, width:'100%', padding: '0px', display: 'flex', justifyContent: 'space-around', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ccc' }}>
            <table style={{width:'100%', marginTop: 0, marginBottom: 0, borderRadius: 0}}>
			<tbody>
				<tr>
					<td style={{ margin: 0, fontSize: '1em', textAlign: 'left',  padding: '10px 0px 0px 20px'}}>伺  服  器：<strong>{connectionStatus}</strong></td>
                    <td  rowSpan="2" style={{ margin: 0, padding: '0px 0px 0px 0px'}}><h1 style={{ margin: 0, fontSize: '35px'}}>庫存盤點系統</h1></td>
					<td style={{  margin: 0, padding: '10px 20px 0px 0px', textAlign: 'right' }}><button style={{ fontFamily: 'Chocolate Classical Sans', margin: 0,  }} onClick={() =>  setShowGuide(true)}>說明</button>
                    <button style={{ fontFamily: 'Chocolate Classical Sans',  marginLeft: '5px', marginTop: '0px'}} onClick={() => setIsArchiveModalOpen(true)}>歸檔</button>
                    <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px', marginTop: '0px'}} onClick={() => setIsProductModalOpen(true)}>缺漏</button></td>
				</tr>
				<tr>
					<td style={{ margin: 0, fontSize: '1em', textAlign: 'left',  padding: '0px 0px 10px 20px'  }}>在線人數：<strong>{userCount}</strong>人</td>
					<td style={{  margin: 0, padding: '0px 20px 10px 0px', textAlign: 'right', }}><button style={{ fontFamily: 'Chocolate Classical Sans', marginTop: '5px' }} onClick={() => setIsExportModalOpen(true)}>導出 Excel</button>
                    <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={() => setUploadModalOpen(true)}>匯總報表</button></td>
				</tr>
				</tbody>
				</table>
            </nav>
            </header>

	        <div>

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
                        <th style={{border: '2px solid #eee', width: '105.26px' }}>商品編號</th>
                        <th style={{border: '2px solid #eee', width: '345.74px' }}>商品名稱</th>
                        <th style={{border: '2px solid #eee', width: '60px' }}>數量</th>
                        <th style={{border: '2px solid #eee'}}>單位</th>
                        <th style={{border: '2px solid #eee'}}>到期日</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((product, index) => (
                        product.廠商 !== '#N/A' && ( // 顯示時排除廠商值為 #N/A 的行
                            <tr key={product.商品編號}>
                                <td style={{border: '2px solid #eee'}}>{product.商品編號}</td>
                                <td style={{border: '2px solid #eee', textAlign: 'left', cursor: 'pointer' }} onMouseEnter={(e) => handleMouseEnter(product, e)} onMouseLeave={handleMouseLeave}>{product.商品名稱}</td>
                                <td style={{ border: '2px solid #eee', width: '60px' }}><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyDown={(e) => handleKeyPress(e, index)} data-index={index} required /></td>
                                <td style={{border: '2px solid #eee'}}>{product.單位}</td>
                                <td style={{border: '2px solid #eee'}}><input className='date' type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} /></td>
                            </tr>
                        )))}
                </tbody>
            </table>
			{/* 載入提示 */}
            {loading && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div>   
            <BouncyComponent />
        </div>
                </div>
  
            )}
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
			{/* 使用ProductModal */}
            <ProductModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                setProducts={setProducts} 
            />

            {/* 使用ArchiveModal */}
            <ArchiveModal 
                isOpen={isArchiveModalOpen} 
                onClose={() => setIsArchiveModalOpen(false)} 
                products={products} 
            />

            {/* 使用ExportModal */}
<ExportModal
    isOpen={isExportModalOpen}
    onClose={() => setIsExportModalOpen(false)}
    products={products}
/>

            {/* 使用GuideModal */}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
			
                <Modal
				isOpen={isModalOpen} 
                    title={modalContent.title}
                    message={modalContent.message}
                    onClose={() => setIsModalOpen(false)}
                    type={modalContent.type}
                />
           
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
		</>
    );
};

export default App;