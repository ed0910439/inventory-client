import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://inventory.edc-pws.com'); // 根据需要可能更改

// 样式定义
const modalStyles = {
  lineHeight: '1.8',
  display: 'flex',
  justifyContent: 'center',
  position: 'fixed',
  background: 'white',
  top: '30%',
  left: '40%',
  transform: 'translate(-30%, -50%)',
  padding: '10px',
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
const App = () => {

  const [products, setProducts] = useState([]);
  const [initialStockData, setInitialStockData] = useState({}); // 使用物件來存儲期初庫存
  const [newMessage, setNewMessage] = useState(''); // 用於存儲新數據提示內容
  const [showToast, setShowToast] = useState(false); // 控制提示顯示
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ // 用于新產品的初始状态
    商品編號: '',
    商品名稱: '',
    規格: '',
    數量: 0,
    單位: '',
    到期日: '',
  });
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [userCount, setUserCount] = useState(0); // 用於存儲線上人數
  const [initialStock, setInitialStock] = useState(''); // 用於存儲期初庫存量
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 }); // 記錄工具提示的位置
  const [password, setPassword] = useState('');
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://inventory.edc-pws.com/api/products');
        setProducts(response.data);
        setConnectionStatus('連接成功');
      } catch (error) {
        console.error("獲取產品時出錯:", error);
        setConnectionStatus('失去連線');
      }
    };

    const fetchInitialStockData = async () => {
      try {
        const response = await axios.get('https://inventory.edc-pws.com/archive/originaldata');
        const initialStockMap = {};
        response.data.forEach(item => {
          initialStockMap[item.商品名稱] = item.數量; // 儲存成物件以便查詢
        });
        setInitialStockData(initialStockMap);
      } catch (error) {
        console.error("獲取期初庫存數據時出錯:", error);
      }
    };

    fetchProducts();
    fetchInitialStockData();

    // 監聽連接的用戶數更新
    socket.on('updateUserCount', (count) => {
      setUserCount(count);
    });

    // 设置 socket 监听和事件处理
    socket.on('連接成功', () => {
      setConnectionStatus('連接成功');
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
    }, 3000);
	  
    });

    // 在组件卸载時清理事件监听
    return () => {
      socket.off('連接成功');
      socket.off('失去連線');
      socket.off('productUpdated');
      socket.off('updateUserCount');
    };
  }, []);

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
  const handleMouseEnter = (productCode, e) => {
    setHoveredProduct(productCode); // 設置當前懸停的商品編號
    setInitialStock(initialStockData[productCode] || '未設定'); // 查找對應的期初庫存
    const rect = e.currentTarget.getBoundingClientRect(); // 獲取當前商品行的邊界	
    setTooltipPosition({ top: e.clientY + 10, left: e.clientX + 10 }); // 更新工具提示位置
  };

  const handleMouseLeave = () => {
    setHoveredProduct(null);
    setInitialStock('');
  };

  // 開啟新增產品的模態框，並關閉盤點歸檔的模態框
  const openProductModal = () => {
    setIsModalOpen(true);
    setIsArchiveModalOpen(false);
  };

  // 開啟盤點歸檔的模態框，並關閉新增產品的模態框
  const openArchiveModal = () => {
    setIsArchiveModalOpen(true);
    setIsModalOpen(false);
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

      alert('歸檔成功：' + JSON.stringify(response.data));
      setIsArchiveModalOpen(false);
    } catch (error) {
      console.error('歸檔請求失敗:', error);
      alert('歸檔失敗:請檢查網路連接狀態或稍後再試\n' + (error.response ? error.response.data : error.message));
    }
  };
  // 新增產品的状态处理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prevProduct => ({ ...prevProduct, [name]: value }));
  };
  // 处理新增產品逻辑
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
      }); // 重置新產品状态
    } catch (error) {
      console.error("新增產品時出錯:", error);
    }
  };

  return (
    <div>

      {/* 導航條 */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, padding: '10px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f4f4f4',
        borderBottom: '1px solid #ccc'
      }}>
        <h1 style={{ margin: 0, display: 'inline-block' }}>庫存盤點系統</h1>
        <div style={{ margin: 0 }}>
          <label>伺服器: <strong>{connectionStatus}</strong></label><br />
          <label>線上使用者: <strong>{userCount}</strong>人</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={{ fontFamily: 'Chocolate Classical Sans', marginRight: '10px' }} onClick={openArchiveModal}>盤點歸檔</button>
          <button style={{ fontFamily: 'Chocolate Classical Sans', marginRight: '10px' }} onClick={openProductModal}>品項缺漏</button>
        </div>
      </nav>
      <div style={{ paddingTop: '60px' }}>

        <table>
          <thead>
            <tr>
              <th>商品編號</th>
              <th>商品名稱</th>
              <th>數量</th>
              <th>單位</th>
              <th>到期日</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.商品編號}>
                <td>{product.商品編號}</td>
                <td className='name' onMouseEnter={(e) => handleMouseEnter(product.商品名稱, e)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: 'pointer' }} // 改變鼠標指標為手型
                >{product.商品名稱}</td>
                <td><input type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} required />
                </td>
                <td>{product.單位}</td>
                <td><input type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 顯示工具提示 */}
      {hoveredProduct && (
        <div style={{ 
		fontSize:'12px', 
		position: 'fixed', 
		backgroundColor: 'white', 
		border: '1px solid #ccc', 
		padding: '5px', borderRadius: '5px', 
		zIndex: 1000, 
		top: tooltipPosition.top, // 使用游標的 Y 坐標 
        left: tooltipPosition.left, // 使用游標的 X坐標 
        pointerEvents: 'none', // 確保工具提示不干擾其他元素的互動 
        }}>
          商品名稱: {hoveredProduct}<br />
          期初庫存量: {initialStock}
        </div>
      )}
	  {/* 短暫提示 */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
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
      {/* 弹窗组件 */}
      {isModalOpen && (
        <div style={overlayStyles} onClick={() => setIsModalOpen(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <div>
              <h2>新增品项</h2>
              <input name="商品名稱" placeholder="商品名稱" value={newProduct.商品名稱} onChange={handleInputChange} autoFocus required />
              <input name="數量" type="number" placeholder="盤點量" value={newProduct.數量} onChange={handleInputChange} required />
              <input name="單位" placeholder="單位" value={newProduct.單位} onChange={handleInputChange} />
              <br />
              <label>到期日：</label>
              <input name="到期日" type="date" value={newProduct.到期日} onChange={handleInputChange} />
              <div>
                <button onClick={handleAddProduct}>送出</button>
                <button onClick={() => setIsModalOpen(false)}>關閉</button>
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
              <label>
                年份：
                <input type="number" value={year} onChange={e => setYear(e.target.value)} min="2000" max="2100" required />
              </label>
              <label>　</label>
              <label>
                月份：
                <input type="number" value={month} onChange={e => setMonth(e.target.value)} min="1" max="12" required />
              </label>
              <br />
              <label>
                管理員密碼：
                <input style={{ width: '145px' }} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </label>
              <br />
              <div>
                <button onClick={handleArchiveSubmit}>存檔</button>
                <button onClick={() => setIsArchiveModalOpen(false)}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;