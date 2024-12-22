import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProductList = ({ storeName }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`https://inventory.edc-pws.com/api/products/${storeName}`);
                if (response.status !== 204) {
                    setProducts(response.data);
                }
            } catch (error) {
                console.error('取得產品失敗:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [storeName]); // 依賴的變量: storeName
    
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
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
                                <td id="品名" className="in-td"  onMouseEnter={(e) => handleMouseEnter(product, e)} onMouseLeave={handleMouseLeave}>{product.商品名稱}</td>
                                <td id="數量-行" className="in-td" style={{ width: '80px' }}><label><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyDown={(e) => handleKeyPress(e, index)} data-index={index} required /> &nbsp;&nbsp;{product.單位}</label></td>
                                <td id="數量-固" className="in-td"><input name="數量" type="number" value={product.數量} onChange={(e) => handleQuantityChange(product.商品編號, +e.target.value)} onKeyDown={(e) => handleKeyPress(e, index)} data-index={index} required /></td>
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



export default ProductList;
