import React from 'react';
import './style/Modal-messages.css'; // 確保樣式已正確引入

const ConfirmModal = ({ isOpen, message, title, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {title && <h2>{title}</h2>}
                <p>{message}</p>
                <button onClick={onClose}>取消</button>
                <button onClick={() => {
                    onConfirm();
                    onClose(); // 確認後關閉 Modal
                }}>確定</button>
            </div>
        </div>
    );
};

export default ConfirmModal;
