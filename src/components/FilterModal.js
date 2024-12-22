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
    
    if (!isOpen) return null;

    return (
  <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content"  id="style-3" onClick={(e) => e.stopPropagation()}>
            
                            <table className="table" style={{ margin: 5 }}>
                                <tbody>
                                    <tr>
                                        <th style={{ width: '80px', padding: '10', margin: '5' }}><h2>�t��</h2></th>
                                        <th style={{ width: '80px', padding: '10', margin: '5' }}><h2>�żh</h2></th>
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
                                            {['�N��', '�N��', '�`��', '�M��', '�ƫ~'].map(layer => (
                                                <li className="li"><label key={layer} className="filter-item">
                                                    <input type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => handleLayerChange(layer)} />
                                                    {layer}
                                                </label></li>
                                            ))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    
                    <button onClick={setIsFilterModalOpen(false)}>����</button>
                    
                    </div >
                   

    );
}

export default FilterModal;
