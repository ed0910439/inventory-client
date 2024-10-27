import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://inventory.edc-pws.com'); // 根据需要可能更改

// 样式定义
const modalStyles = {
    display: 'flex',
    justifyContent: 'center',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 50px rgba(0, 0, 0, 0.3)',
    zIndex: 1000, // 确保弹窗在其他内容上方
};

const App = () => {
    const [products, setProducts] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [isModalOpen, setIsModalOpen] = useState(false); // 控制弹窗是否打开
    const [newProduct, setNewProduct] = useState({ // 用于新产品的初始状态
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
                const response = await axios.get('https://inventory.edc-pws.com/api/products');
                setProducts(response.data);
                setConnectionStatus('Connected');
            } catch (error) {
                console.error("获取产品时出错:", error);
                setConnectionStatus('Disconnected');
            }
        };
        
        fetchProducts();

        // 设置 socket 监听和事件处理
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

        // 在组件卸载时清理事件监听
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('productUpdated');
        };
    }, []);

    const updateQuantity = async (productCode, quantity) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/quantity`, { 數量: quantity });
        } catch (error) {
            console.error("更新产品时出错:", error);
        }
    };

    const updateExpiryDate = async (productCode, expiryDate) => {
        try {
            await axios.put(`https://inventory.edc-pws.com/api/products/${productCode}/expiryDate`, { 到期日: expiryDate });
        } catch (error) {
            console.error("更新到期日时出错:", error);
        }
    };

    const handleQuantityChange = (productCode, quantity) => {
        if (quantity < 0) {
            alert("数量不能为负数。");
            return;
        }
        const updatedProducts = products.map(product =>
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

    // 新增产品的状态处理
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prevProduct => ({ ...prevProduct, [name]: value }));
    };

    // 处理新增产品逻辑
    const handleAddProduct = async () => {
        try {
            const nextNumber = products.length + 1; // 下一个編號
            const newProductWithNumber = {
                ...newProduct,
                商品編號: `新 - ${nextNumber}`,
            };
            
            const response = await axios.post('https://inventory.edc-pws.com/api/products', newProductWithNumber);
            setProducts([...products, response.data]); // 更新产品列表
            setIsModalOpen(false); // 关闭弹窗
            setNewProduct({
                商品編號: '',
                商品名稱: '',
                規格: '',
                數量: 0,
                單位: '',
                到期日: '',
            }); // 重置新产品状态
        } catch (error) {
            console.error("新增产品时出错:", error);
        }
    };

    return (
        <div>
            <button style={{ position: 'fixed', bottom: '20px', left: '20px' }} onClick={() => setIsModalOpen(true)}>
                遗漏报告
            </button>
            <div>
                <p>服务器状态: <strong>{connectionStatus}</strong></p>
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
                            <td className='name'>{product.商品名稱}</td>
                            <td className='spec'>{product.規格 || '未設定'}</td>
                            <td>
                                <input 
                                    type="number" 
                                    value={product.數量} 
                                    onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} 
                                    required 
                                />
                            </td>
                            <td>{product.單位}</td>
                            <td>
                                <input 
                                    type="date" 
                                    value={product.到期日 ? new Date(product.到期日).toISOString().split('T')[0] : ""} 
                                    onChange={(e) => handleExpiryDateChange(product.商品編號, e.target.value)} 
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 弹窗组件 */}
            {isModalOpen && (
                <div style={modalStyles}>
                    <div>
                        <h2>新增品项</h2>
                        <input
                            name="商品名稱"
                            placeholder="商品名稱"
                            value={newProduct.商品名稱}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            name="數量"
                            type="number"
                            placeholder="盤點量"
                            value={newProduct.數量}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            name="單位"
                            placeholder="單位"
                            value={newProduct.單位}
                            onChange={handleInputChange}
                            required
                        />
                        <br />
                        <label>到期日：</label>
                        <input
                            type="date"
                            name="到期日"
                            value={newProduct.到期日}
                            onChange={handleInputChange}
                        />
                        <div>
                            <button onClick={handleAddProduct}>送出</button>
                            <button onClick={() => setIsModalOpen(false)}>關閉</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
