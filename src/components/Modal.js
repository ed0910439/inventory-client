import React from 'react';
import './style/Modal-messages.css'; // 確保樣式已正確引入

const Modal = ({ isOpen, message, title, onClose, type, onConfirm, showConfirmButton }) => {
    const getModalClass = () => {
        switch (type) {
            case 'success':
                return 'modal-success';
            case 'error':
                return 'modal-error';
            case 'warning':
                return 'modal-warning';
            default:
                return '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${getModalClass()}`} onClick={(e) => e.stopPropagation()}>
                {title && <h2>{title}</h2>}
                <p>{message}</p>
                <button onClick={onClose}>關閉</button>
                {showConfirmButton && <button onClick={() => {
                    onConfirm();
                    onClose(); // 確定後關閉 Modal
                }}>確定</button>}
            </div>
        </div>
    );
};

export default Modal;
