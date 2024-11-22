import React, { useState } from 'react';
import './Modal.css';

const ProductModal = ({ isOpen, onClose, products }) => {
    const [newProduct, setNewProduct] = useState({
        商品名稱: '',
        規格: '',
        數量: 0,
        單位: '',
        到期日: '',
    });
 
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

            const response = await axios.post(`http://localhost:4000/api/products`, newProductWithNumber);
            setProducts([...products, response.data]); // 更新產品列表
			onClose(); // 提交後關閉模態框
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
		    if (!isOpen) return null;

    return (
  <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content"  id="style-3" onClick={(e) => e.stopPropagation()}>
                        <div>
                            <h2>新增品項</h2>
                            <table>
							<tbody>
								<tr>
									<td  colspan="2" ><label>商品名稱：</label><input name="商品名稱" placeholder="商品名稱" value={newProduct.商品名稱} onChange={handleInputChange} autoFocus required /></td>
								</tr>
								<tr>
									<td><label>數量：</label><input name="數量" type="number" placeholder="盤點量" value={newProduct.數量} onChange={handleInputChange} required /></td>
									<td><label>單位：</label><input name="單位" placeholder="單位" value={newProduct.單位} onChange={handleInputChange} /></td>
								</tr>
								<tr>
									<td  colspan="2" ><label>商品校期：</label><input name="到期日" type="date" value={newProduct.到期日} onChange={handleInputChange} /></td>
								</tr>
								</tbody>
							</table>
                                <div>
                                <button style={{ fontFamily: 'Chocolate Classical Sans'}}  onClick={handleAddProduct}>送出</button>
                                <button style={{ fontFamily: 'Chocolate Classical Sans', marginLeft: '5px' }} onClick={onClose}>取消</button>
                                </div>

                        </div>
                    </div>
                </div>
            );
            			};
export default ProductModal;