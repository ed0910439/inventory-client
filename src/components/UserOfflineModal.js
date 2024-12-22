//UserOfflineModal.js

import React, { useState } from 'react';

const UserOfflineModal = ({ isOpen, onClose }) => {	    



if (!isOpen) return null;

    return (
  <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content"  id="style-3" onClick={(e) => e.stopPropagation()}>
                   <h2>您已離線</h2>
                        <p>請檢查網絡連線是否正常，或聯繫管理員協助處理。</p>
                        <button style={{ fontFamily: 'Chocolate Classical Sans' }} onClick={handleReconnect}>重新上線</button>
                    </div>
                </div>
            )
			}
			export default UserOfflineModal;