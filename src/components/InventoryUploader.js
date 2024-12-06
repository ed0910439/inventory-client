import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductDataInput = ({ isOpen, onClose, products }) => {
    const [newProducts, setNewProducts] = useState([]);
    const [completedProducts, setCompletedProducts] = useState([]);

    const handleStart = async () => {
        try {
            const response = await axios.get('http://localhost:4000/api/fetchNewProducts');
            setNewProducts(response.data);
        } catch (error) {
            console.error('获取新品时出错:', error);
        }
    };

    const handleInputChange = (index, field, value) => {
        const updatedProducts = [...newProducts];
        updatedProducts[index][field] = value;
        setNewProducts(updatedProducts);
    };

    const handleSubmit = async () => {
        try {
            await axios.post('/api/saveCompletedProducts', newProducts);
            alert('新產品保存成功！');
            setCompletedProducts([...completedProducts, ...newProducts]);
            setNewProducts([]);
        } catch (error) {
            console.error('保存產品時出錯:', error);
            alert('保存失敗，請稍後再試。');
        }
    };
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>

                <h3>開始盤點</h3>
                <button onClick={handleStart}>開始</button>
                </div>
            <h2>新品補齊信息</h2>
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
                {newProducts.map((product, index) => (
                    <div key={product.商品編號}>
                        <td id="編號" className="in-td">{product.商品編號}</td>
                        <td id="品名" className="in-td">{product.商品名稱}</td>
                        <td><input
                            type="text"
                            placeholder="規格"
                            value={product.規格 || ''}
                            onChange={(e) => handleInputChange(index, '規格', e.target.value)}
                        /></td>
                        <td><input
                            type="text"
                            placeholder="廠商"
                            value={product.廠商 || ''}
                            onChange={(e) => handleInputChange(index, '廠商', e.target.value)}
                        /></td>
                        <td>

                        <select
                            value={product.溫層 || ''}
                            onChange={(e) => handleInputChange(index, '溫層', e.target.value)}>
                            <option value="" disabled>選擇溫層</option>
                            <option value="冷藏">冷藏</option>
                            <option value="冷凍">冷凍</option>
                            <option value="常溫">常溫</option>
                            <option value="清潔">清潔</option>
                            <option value="備品">備品</option>
                            </select>
                        </td>
                    </tbody>
                    </table>
                    </div>
                ))}
                <button onClick={handleSubmit}>保存</button>
        </div>

            );
};

export default ProductDataInput;