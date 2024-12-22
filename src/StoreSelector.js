import React from 'react';

const StoreSelector = ({ storeName, onStoreChange, stores }) => {
    return (
        <select value={storeName} onChange={onStoreChange}>
            {stores.map((store, index) => (
                <option key={index} value={store}>{store}</option>
            ))}
        </select>
    );
};

export default StoreSelector;
