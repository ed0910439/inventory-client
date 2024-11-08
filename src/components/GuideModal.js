import React from 'react';
import './Modal.css';

const GuideModal = ({ isOpen, onClose}) => {
    return (
  <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content"  id="style-3" onClick={(e) => e.stopPropagation()}>
		
                            <h2>系統介紹</h2>
                            <p>庫存盤點系統是一個用於查詢和管理庫存商品的 Web 應用程序。通過該系統，使用者可以輕鬆查看商品信息、更新庫存數量、導出報表以及進行盤點歸檔。   </p>
                            <h2>功能概述</h2>
                            <ul style={{ textAlign: 'left' }}>
                                <li><strong>商品管理</strong>：查看所有庫存商品的詳細信息，包括商品編號、名稱、規格、庫存數量等。</li>
                                <li><strong>更新庫存數量</strong>：在數量欄位輸入新的庫存量，並支持 <code>Enter</code> 鍵以快速跳至下一個輸入框。</li>
                                <li><strong>瀏覽數據</strong>：可顯示商品的期初庫存量、進貨規格。</li>
                                <li><strong>導出數據</strong>：用戶可以匯出當前的庫存資料到 Excel 文件。</li>
                                <li><strong>歷史資料</strong>：將盤點數據保留以便月底時生成期初庫存。</li>
                            </ul>
                            <h2>如何使用</h2>
                            <ol style={{ textAlign: 'left' }}>
                                <li><p><strong>登錄系統</strong>：進入系統首頁，輸入您的用戶憑證進行登錄。</p>
                                </li>
                                <li><p><strong>查看商品規格和顯示期初庫存</strong>：</p>
                                    <ul>
                                        <li>系統將顯示商品列表，用戶可以查看各項商品的詳情。</li>
                                        <li>輕觸欲查詢商品名稱時，即可以顯示該商品的單位規格。</li>
                                        <li>輕觸欲查詢商品名稱時，即可以顯示該商品的期初庫存量。</li>

                                    </ul>
                                </li>
                                <li><p><strong>更新商品庫存</strong>：</p>
                                    <ul>
                                        <li>在數量欄位中直接輸入新的庫存數量，完成後按 <code>Enter</code> 鍵自動跳到下一個商品的數量輸入框。</li>
                                    </ul>
                                </li>
                                <li><p><strong>導出數據</strong>：</p>
                                    <ul>
                                        <li>輕觸“導出 Excel”按鈕，將當前商品庫存資料保存為 <code>.xls</code> 文件。</li>
                                    </ul>
                                </li>
                                <li><p><strong>進行盤點歸檔</strong>：</p>
                                    <ul>
                                        <li>輕觸將結束本次盤點。須驗證管理員密碼以完成歸檔。</li>
                                    </ul>
                                </li>
                            </ol>
                            <h2>多人同步功能</h2>
                            <h4>系統支持多人同時線上作業，數據將實時推送至所有用戶端使用</h4>
                            <ul style={{ textAlign: 'left' }}>
                                <li>通過 WebSocket 技術（socket.io）來實現即時數據更新。</li>
                                <li>當一名用戶更新某個商品的庫存，其他連接的用戶將會即時收到更新的通知，並可以看到最新的庫存信息。</li>
                                <li>在伺服器斷線時，系統會顯示一個覆蓋整個畫面的半透明消息，提醒用戶網絡連接問題及解決辦法，包括聯繫管理員的建議。</li>
                            </ul>
                            <h2>常見問題</h2>
                            <ol style={{ textAlign: 'left' }}>
                                <li><p><strong>我如何導出產品庫存數據？</strong></p>
                                    <ul>
                                        <li>點擊“導出 Excel”按鈕即可下載當前庫存數據。</li>
                                    </ul>
                                </li>
                                <li><p><strong>盤點歸檔時出現錯誤提示，該怎麼辦？</strong></p>
                                    <ul>
                                        <li>確保您已正確輸入所有字段，包括年份、月份和管理員密碼。</li>
                                    </ul>
                                </li>
                                <li><p><strong>為什麼我的數量更新不會被保存？</strong></p>
                                    <ul>
                                        <li>確保您在更新庫存數量後按下 <code>Enter</code> 鍵。</li>
                                    </ul>
                                </li>
                                <li><p><strong>如何查看特定商品的期初庫存？</strong></p>
                                    <ul>
                                        <li>將鼠標懸停在商品編號上，即可查看該商品的期初庫存。</li>
                                    </ul>
                                </li>
                </ol>
                <button onClick={onClose}>關閉</button>
				</div>
           
        </div>
		
    );
};


export default GuideModal;


