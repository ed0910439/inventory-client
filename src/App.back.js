import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');
// 樣式定義
const modalStyles = {
  justifyalign: 'center',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 0 50px rgba(0, 0, 0, 0.3)',
  zIndex: 1000, // 確保彈窗在其他内容上方
};
function App() {
  const [products, setProducts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制彈窗是否打開
  const [newProduct, setNewProduct] = useState({ // 用於新產品的初始狀態
    商品編號: '',
    商品名稱: '',
    規格: '',
    數量: 0,
    單位: '',
    到期日: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/products');
        setProducts(response.data);
        setConnectionStatus('Connected');
      } catch (error) {
        console.error("獲取產品時出錯:", error);
        setConnectionStatus('Disconnected');
      }
    };
    
    fetchProducts();
	
	// 設置 socket 監聽和事件處理
    socket.on('connect', () => {
      setConnectionStatus('Connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected');
    });

    socket.on('productUpdated', (updatedProduct) => {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.商品編號 === updatedProduct.商品編號 ? updatedProduct : product
        )
      );
    });

    // 在組件卸載時清理計時器和 socket
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('productUpdated');
    };
  }, []);

  const updateQuantity = async (productCode, quantity) => {
    try {
      await axios.put(`http://localhost:4000/api/products/${productCode}`, { 數量: quantity });
    } catch (error) {
      console.error("更新產品時出錯:", error);
    }
  };

  const updateExpiryDate = async (productCode, expiryDate) => {
    try {
      await axios.put(`http://localhost:4000/api/products/${productCode}`, { 到期日: expiryDate });
    } catch (error) {
      console.error("更新到期日時出錯:", error);
    }
  };

  const handleQuantityChange = (productCode, quantity) => {
    if (quantity < 0) {
      alert("數量不能為負數。");
      return;
    }
    const updatedProducts = products.map(product =>
      product.商品編號 === productCode ? { ...product, 數量: quantity } : product );
    setProducts(updatedProducts);
    updateQuantity(productCode, quantity);
  };

  const handleExpiryDateChange = (productCode, expiryDate) => {
    const updatedProducts = products.map( product =>
      product.商品編號 === productCode ? { ...product, 到期日: expiryDate } : product );
    setProducts(updatedProducts);
    updateExpiryDate(productCode, expiryDate);
  };
  
 // 新增產品
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prevProduct => ({ ...prevProduct, [name] : value, }));
  };
  // 處理新增產品邏輯
  const handleAddProduct = async () => {
    try {
      // 自動生成商品編號
      const nextNumber = products.length + 1; // 下一个編號
      const newProductWithNumber = {
        ...newProduct,
        商品編號: `新 - ${nextNumber}`,
      };
      
      const response = await axios.post('http://localhost:4000/api/products', newProductWithNumber);
      setProducts([...products, response.data]); // 更新產品列表
      setIsModalOpen(false); // 關閉彈窗
      setNewProduct({ // 重置新產品狀態
        商品編號: newProductWithNumber,
        商品名稱: '',
        規格: '',
        數量: '',
        單位: '',
        到期日: ''
      });
    } catch (error) {
      console.error("新增產品時出錯:", error);
    }
  };

  return (
    <div>
	  {/* 遺漏回報按鈕 */}
      <button style={{ position: 'fixed', bottom: '20px', left: '20px' }} onClick={() => setIsModalOpen(true)}>
        遺漏回報
      </button>
      <h1>庫存盤點系統</h1>
      <div>
        <p>伺服器狀態: <strong>{connectionStatus}</strong></p>
      </div>
      <table>
        <thead>
          <tr>
            <th>商品編號</th>
            <th>商品名稱</th>
            <th>規格</th>
            <th>數量</th>
            <th>單位</th>
            <th>到期日</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.商品編號}>
              <td>{product.商品編號}</td>
              <td className = 'name'>{product.商品名稱}</td>
              <td className = 'spec'>{product.規格 || '未設定'}</td>
              <td>
                <input type="number" value={product.數量} onChange={(e) =>handleQuantityChange(product.商品編號, +e.target.value)} required /></td>
              <td>{product.單位}</td>
              <td>
                <input type="date" value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0]:"" } onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
	  <div>


      {/* 彈窗 */}
      {isModalOpen && (
        <div style={modalStyles}>
          <h2>新增品项</h2>
		  <input className = 'name'
            name="商品名稱"            
			placeholder="商品名稱"
            value={newProduct.商品名稱}
            onChange={handleInputChange}
			autofocus required
          />　
          <input
            className = 'number'
            name="數量"
            placeholder="盤點量"
            onChange={handleInputChange} required
          />　
          <input className = 'unit'
            name="單位"
            placeholder="單位"
            value={newProduct.單位}
            onChange={handleInputChange} required
          />
		  <br></br>
          到期日：<input className = 'date'
            type="date"
            name="到期日"
            value={newProduct.到期日}
            onChange={handleInputChange}
          />
		  <br></br><br></br><br></br>
          <button onClick={handleAddProduct}>送出</button>
          　<button onClick={() => setIsModalOpen(false)}>關閉</button>
        </div>
	  )}
	  </div>
    </div>
  );
};

export default App;
