import React, { useState } from 'react';
import axios from 'axios';

function StartInventory() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inventoryTemplate, setInventoryTemplate] = useState(null);
    const [initialStockData, setInitialStockData] = useState(null);
    const [uploadError, setUploadError] = useState(''); // ���~�T��


    const handleInventoryTemplateChange = (e) => {
        setInventoryTemplate(e.target.files[0]);
    };

    const handleInitialStockDataChange = (e) => {
        setInitialStockData(e.target.files[0]);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploadError(''); // �M�����e�����~�T��

        if (!inventoryTemplate || !initialStockData) {
            setUploadError('�п�ܽL�I�ҪO�M����ƾ��ɮ�');
            return;
        }


        const formData = new FormData();
        formData.append('inventoryTemplate', inventoryTemplate);
        formData.append('initialStockData', initialStockData);

        try {
            const response = await axios.post('/api/startInventory', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('�W�Ǧ��\:', response.data);
            alert('�L�I�ƾڤw���\�W��!');
            setIsModalOpen(false); // �����u��

        } catch (error) {
            console.error('�W�ǥ���:', error);
            setUploadError(error.response ? error.response.data.error : '�W�ǥ��ѡA�еy��A��');
        }
    };



    return (
        <div>
            <button onClick={() => setIsModalOpen(true)}>�}�l�L�I</button>

            {/* �u�� */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>�}�l�L�I</h2>
                        <form onSubmit={handleSubmit}>
                            <p>
                                �L�I�ҪO�G
                                <input type="file" accept=".xls,.xlsx" onChange={handleInventoryTemplateChange} required />
                            </p>
                            <p>
                                ����ƾڡG
                                <input type="file" accept=".xls,.xlsx" onChange={handleInitialStockDataChange} required />
                            </p>
                            {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                            <button type="submit">�W��</button>
                            <button onClick={() => setIsModalOpen(false)}>����</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default StartInventory;
