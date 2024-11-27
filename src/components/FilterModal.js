//FilterModal.js


import React, { useState, useRef, useEffect } from 'react';

function FilterModal({ isOpen, onClose, products, onFilterChange }) {
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [selectedLayers, setSelectedLayers] = useState([]);
    const allVendors = ['���x', '���p', '���y', '���Y', '�}��', '�ζP', '�����a', '�I�u��'];
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target)) {
                onFilterChange(selectedVendors, selectedLayers); // Notify parent when closing
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleVendorChange = (vendor) => {
        setSelectedVendors((prev) => {
            if (prev.includes(vendor)) {
                return prev.filter((v) => v !== vendor);
            } else {
                return [...prev, vendor];
            }
        });
    };

    const handleLayerChange = (layer) => {
        setSelectedLayers((prev) =>
            prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
        );
    };
    

    return (
        <div className="modal-overlay" ref={overlayRef}>
            <div className="modal-content" id="style-3">
                <div className="filter-bubble">
                    <div className="filter-column">
                        <h2>�t�ӿz��</h2>
                        {allVendors.map((vendor) => (
                            <label key={vendor} className="filter-item">
                                <input
                                    type="checkbox"
                                    checked={selectedVendors.includes(vendor)}
                                    onChange={() => handleVendorChange(vendor)}
                                />
                                {vendor}
                            </label>
                        ))}
                    </div>
                    <div className="filter-column">
                        <h2>�żh�z��</h2>
                        {['�N��', '�N��', '�`��'].map((layer) => (
                            <label key={layer} className="filter-item">
                                <input
                                    type="checkbox"
                                    checked={selectedLayers.includes(layer)}
                                    onChange={() => handleLayerChange(layer)}
                                />
                                {layer}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FilterModal;
