import React, { useState, useEffect } from 'react';

function ProductModal({ isOpen, product, onSubmit, onClose }) {
    const [spec, setSpec] = useState('');
    const [vendor, setVendor] = useState('');
    const [warehouse, setWarehouse] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSpec(product.規格 || '');
            setVendor('');
            setWarehouse('');
        }
    }, [isOpen, product]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            商品編號: product.商品編號,
            規格: spec,
            廠商: vendor,
            庫別: warehouse,
        });
    };

    return (
        isOpen && (
            <div className="modal">
                <div className="modal-content">
                    <span className="close-button" onClick={onClose}>&times;</span>
                    <h2>新增產品詳情</h2>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>商品編號:</label>
                            <input type="text" value={product.商品編號} disabled />
                        </div>
                        <div>
                            <label>商品名稱:</label>
                            <input type="text" value={product.商品名稱} disabled />
                        </div>
                        <div>
                            <label>規格:</label>
                            <input type="text" value={spec} onChange={(e) => setSpec(e.target.value)} />
                        </div>
                        <div>
                            <label>廠商:</label>
                            <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
                                <option value="" disabled>選擇廠商</option>
                                <option value="Vendor A">Vendor A</option>
                                <option value="Vendor B">Vendor B</option>
                            </select>
                        </div>
                        <div>
                            <label>庫別:</label>
                            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                                <option value="" disabled>選擇庫別</option>
                                <option value="Warehouse A">Warehouse A</option>
                                <option value="Warehouse B">Warehouse B</option>
                            </select>
                        </div>
                        <button type="submit">提交</button>
                    </form>
                </div>
            </div>
        )
    );
}

export default ProductModal;
