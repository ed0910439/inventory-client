import React from 'react';
import './Modal.css';

const GuideModal = ({ isOpen, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" id="style-3" onClick={(e) => e.stopPropagation()}>

                <h1>庫存盤點系統使用手冊</h1>

                <h2>系統介紹</h2>
                <p>庫存盤點系統是一個用於查詢和管理庫存商品的 Web 應用程序。通過該系統，使用者可以輕鬆查看商品信息、更新庫存數量、導出報表以及進行盤點歸檔。</p>

                <h2>功能概述</h2>
                <ul>
                    <li><strong>商品管理</strong>：查看所有庫存商品的詳細信息，包括商品編號、名稱、規格、庫存數量、單位、到期日、廠商及溫層等。</li>
                    <li><strong>更新庫存數量</strong>：在數量欄位輸入新的庫存量，並支持 <code>Enter</code> 鍵以快速跳至下一個輸入框。</li>
                    <li><strong>瀏覽數據</strong>：可顯示商品的期初庫存量及規格。</li>
                    <li><strong>導出數據</strong>：用戶可以匯出當前的庫存資料到 Excel 文件，提供一般格式及 EPOS 上傳格式。</li>
                    <li><strong>歷史資料</strong>：將盤點數據保留以便月底時生成期初庫存 (歸檔功能)。</li>
                    <li><strong>篩選功能</strong>：可根據廠商和溫層篩選商品，方便使用者快速查找特定商品。</li>
                    <li><strong>新增商品</strong>：可新增缺漏商品，方便使用者即時補充庫存資料。</li>
                    <li><strong>多人同步</strong>：支援多人同時線上操作，數據即時更新。</li>
                </ul>

                <h2>操作步驟</h2>
                <h3>1. 登入系統</h3>
                <p>系統目前無需登入，直接進入系統首頁即可開始使用。</p>

                <h3>2. 查看商品資訊</h3>
                <p>系統顯示商品列表，包含商品編號、名稱、數量、單位、到期日等資訊。將滑鼠懸停在商品名稱上，可以查看該商品的期初庫存量和規格。</p>

                <h3>3. 更新商品庫存</h3>
                <p>在「數量」欄位直接輸入新的庫存數量，修改後數據會即時儲存。按下<code>Enter</code>鍵可快速跳到下一個商品的數量輸入框。</p>

                <h3>4. 更新商品到期日</h3>
                <p>在「到期日」欄位選擇新的到期日，修改後數據會即時儲存。部分廠商的到期日欄位可能被停用。</p>

                <h3>5. 篩選商品</h3>
                <p>使用篩選功能可根據「廠商」和「溫層」篩選商品，提高查找效率。勾選您想篩選的廠商或溫層，系統會即時更新顯示的商品列表。</p>

                <h3>6. 新增商品</h3>
                <p>點擊「缺漏」按鈕，打開新增商品視窗，填寫商品資訊後點擊「送出」即可新增商品。</p>

                <h3>7. 數據匯出</h3>
                <p>點擊「匯出」按鈕，打開匯出視窗，輸入年份和月份（EPOS 上傳格式需輸入），選擇匯出格式（一般格式或 EPOS 上傳格式），點擊對應按鈕即可下載 Excel 檔案。</p>

                <h3>8. 盤點歸檔</h3>
                <p>點擊「歸檔」按鈕，打開歸檔視窗，輸入年份、月份和管理員密碼，點擊「存檔」即可完成盤點歸檔。</p>


                <h3>9. 開始盤點</h3>
                <p>點擊「匯總報表」按鈕，上傳盤點模板和期初數據檔案，開始進行盤點作業。</p>

                <h2>多人同步功能</h2>
                <p>系統支持多人同時線上作業，數據將實時推送至所有用戶端。</p>
                <ul>
                    <li>使用 WebSocket 技術 (socket.io) 實現即時數據更新。</li>
                    <li>當一名用戶更新商品庫存，其他連線用戶將即時收到更新通知，並看到最新的庫存信息。</li>
                    <li>網路連線斷線時，系統會顯示覆蓋全螢幕的半透明訊息，提醒用戶網路連線問題及解決方案，並建議聯絡管理員。</li>
                </ul>

                <h2>常見問題</h2>
                <ol>
                    <li><strong>如何導出產品庫存數據？</strong>
                        <ul>
                            <li>點擊「匯出」按鈕，選擇匯出格式，並輸入必要的資料 (如年份、月份)，即可下載當前庫存數據。</li>
                        </ul>
                    </li>
                    <li><strong>盤點歸檔時出現錯誤提示，該怎麼辦？</strong>
                        <ul>
                            <li>請確認已正確輸入所有欄位，包括年份、月份和管理員密碼。</li>
                            <li>請檢查網路連線是否正常。</li>
                        </ul>
                    </li>
                    <li><strong>為什麼我的數量更新不會被保存？</strong>
                        <ul>
                            <li>請確認您已輸入正確的數字，並且在輸入完成後，系統已自動儲存數據。</li>
                        </ul>
                    </li>
                    <li><strong>如何查看特定商品的期初庫存？</strong>
                        <ul>
                            <li>將滑鼠懸停在商品名稱上，即可查看該商品的期初庫存。</li>
                        </ul>
                    </li>
                    <li><strong>部分廠商的到期日欄位無法修改，是什麼原因？</strong>
                        <ul>
                            <li>此為系統設定，部分廠商的到期日欄位可能被系統停用，無法修改。</li>
                        </ul>
                    </li>
                </ol>

                <p>如有任何疑問，請聯繫系統管理員。</p>
                <button onClick={onClose}>關閉</button>
            </div>
        </div>
    );
};


export default GuideModal;

