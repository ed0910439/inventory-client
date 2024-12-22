import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import ExportModal from './components/ExportModal';
import NewProductModal from './components/NewProductModal';
import ArchiveModal from './components/ArchiveModal';
import GuideModal from './components/GuideModal';
import Modal from './components/Modal';
import BouncyComponent from './BouncyComponent';
import InventoryUploader from './components/InventoryUploader';
import { setCookie, getCookie } from './utils/cookie';

const socket = io('http://localhost:4000'); //  �s�u�� Socket.IO ���A��

const App = () => {
    // ���A�ܼ�
    const [showFunctionButtons, setShowFunctionButtons] = useState(false);
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialStockData, setInitialStockData] = useState({});
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [selectedLayers, setSelectedLayers] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('�s�u��...'); // ��l���A�אּ�s�u��
    const [showGuide, setShowGuide] = useState(false);
    const [isOffline, setIsOffline] = useState(false); // �ϥΧ�²�䪺�ܼƦW��
    const [errorModal, setErrorModal] = useState(null); // ��ܿ��~�T���� Modal
    const [modalContent, setModalContent] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [initialStock, setInitialStock] = useState('');
    const [currentSpec, setCurrentSpec] = useState('');
    const [currentunit, setCurrentunit] = useState('');
    const inputRefs = useRef([]);
    const [userCount, setUserCount] = useState(0);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const cookieName = 'inventoryGuideShown';
    const inventoryUploaderRef = useRef();
    const localVersion = '1.0.7';
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isReconnectPromptVisible, setIsReconnectPromptVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [actionTonfirm, setActionToConfirm] = useState(null); // 'clearQuantities' �� 'clearExpiryDates'
    const [isInventoryUploaderOpen, setIsInventoryUploaderOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [storeName, setStoreName] = useState('noStart');
    const allVendors = ['���x', '���p', '���y-��', '���y-��', '���Y', '�}��', '�ζP', '�����a', '�I�u��'];
    const allLayers = ['���ϥ�', '�N��', '�N��', '�`��', '�M��', '�ƫ~'];
    const stores = ['�x�_�ʯ�', '�s���ʯ�', '�H�q�¨q']; // �w�w�q�������C��
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:4000/api/products/${storeName}`);
                if (response.status === 204) {
                    setLoading(false);
                    setIsOffline(false);
                    return;
                } else {
                    setProducts(response.data);
                    setConnectionStatus('�s�����\ ?');
                    setLoading(false);
                    setIsOffline(false); // �����s�u���\�A��s���u���A
                }
            } catch (error) {
                handleError(error, '���o���~����'); // �ϥηs�����~�B�z�禡
                setConnectionStatus('���h�s�u ?');
                setIsOffline(true); // �����s�u���ѡA��s���u���A
            } finally {
                setLoading(false);
            }
        };

        const guideShown = getCookie(cookieName);
        if (!guideShown) { // �p�G cookie ���s�b
            // �]�w�@�ө���A�T�O���󧹥����J��A��ܻ�����U
            setTimeout(() => {
                setShowGuide(true); // ��ܻ�����U
                setCookie(cookieName, cookieValue); // �]�w cookie�A�U���N���|�A���
            }, 1000); // ���� 1 �� (�i�ھڻݭn�վ�)
        }


        fetchProducts();

        // Socket.IO �ƥ��ť
        socket.on('updateUserCount', setUserCount);
        socket.on('productUpdated', (updatedProduct) => {
            setProducts(prevProducts => prevProducts.map(product => product.�ӫ~�s�� === updatedProduct.�ӫ~�s�� ? updatedProduct : product
            ));
            setNewMessage(`${updatedProduct.�ӫ~�W��} �ƶq�ܧ� ${updatedProduct.�ƶq}`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
        });

        // �����s�u���A��ť (�ݭn�ھ��s�������ҽվ�)
        const handleOnline = () => {
            setConnectionStatus('�s�u���\ ?');
            setIsOffline(false);

        };
        const handleOffline = () => {
            setConnectionStatus('���h�s�u ?');
            setIsOffline(true);

        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // �M���禡
        return () => {
            socket.off('updateUserCount', setUserCount);
            socket.off('productUpdated');
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            socket.disconnect();
        };
    }, []);

    const handleStoreChange = (event) => {
        setStoreName(event.target.value); // ��s�w��ܪ������W��
    };

    const startInventory = () => {
        // �n���T�{ storeName �O�_����
        if (!storeName) {
            alert('�п�ܪ����I'); // �N�x�s�אּ�������ܥΤ�
            return;
        }

        if (inventoryUploaderRef.current) {
            inventoryUploaderRef.current.startInventory(); // �եΤl�ե󪺤�k
        }
    };


    const handleProductSubmit = (productDetails) => {
        axios.post('/api/updateProduct', productDetails)
            .then(response => {
                console.log('��s���\:', response.data);
                setIsModalOpen(false);
                setProducts(products.filter(p => p.�ӫ~�s�� !== productDetails.�ӫ~�s��));
            })
            .catch(error => {
                console.error('��s����:', error);
            });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };


    // ���~�B�z�禡
    const handleError = (error, defaultMessage) => {
        const errorMessage = error.response ? error.response.data.message || error.response.data : error.message || defaultMessage;
        setErrorModal({ title: '���~�T��', message: errorMessage });
        setIsModalOpen(true);
    };

    const handleReconnect = () => {
        setConnectionStatus('�s�����\ ?');
        setIsUserOffline(false);
        setIsReconnectPromptVisible(false);

    };



    const handleReload = () => {
        window.location.reload(); // ���s�[������
        setIsModalOpen(false);
    };
    const handleBlur = () => {
        setHoveredProduct(null);
        setInitialStock('');
    };
    // ����t�ӿz��
    const handleVendorChange = (vendor) => {
        setSelectedVendors((prev) => prev.includes(vendor) ? prev.filter(v => v !== vendor) : [...prev, vendor]
        );
    };

    // ����żh�z��
    const handleLayerChange = (layer) => {
        setSelectedLayers((prev) => prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
        );
    };

    // �ھکҿ諸�t�өM�żh�L�o���~
    const filteredProducts = products.filter(product => {
        const vendorMatch = selectedVendors.length === 0 || selectedVendors.includes(product.�t��);
        const layerMatch = selectedLayers.length === 0 || selectedLayers.includes(product.�żh);
        return vendorMatch && layerMatch; // �u��ܲŦX�z����󪺲��~
    });

    const handleKeyPress = (event, index) => {
        if (event.key === 'Enter') {
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus(); // �N�J�I����U�@�ӿ�J��
            }
        }
    };

    //�U���̷s�ƶq
    const updateQuantity = async (productCode, quantity) => {
        try {
            await axios.put(`http://localhost:4000/api/products/${productCode}/quantity/${storeName}`, { �ƶq: quantity });
        } catch (error) {
            console.error("��s���~�ɥX��:", error);
        }
    };
    //�U���̷s�մ�
    const updateExpiryDate = async (productCode, expiryDate) => {
        try {
            await axios.put(`http://localhost:4000/api/products/${productCode}/expiryDate/${storeName}`, { �����: expiryDate });
        } catch (error) {
            console.error("��s�����ɥX��:", error);
        }
    };
    //�W�Ǽƶq
    const handleQuantityChange = (productCode, quantity) => {
        // ��J����: �T�O�ƶq���D�t��
        const numQuantity = Number(quantity);
        if (isNaN(numQuantity) || numQuantity < 0) {
            alert('�ƶq�������D�t��');
            return;
        }
        const updatedProducts = products.map(product => product.�ӫ~�s�� === productCode ? { ...product, �ƶq: numQuantity } : product
        );
        setProducts(updatedProducts);
        updateQuantity(productCode, numQuantity);
    };
    //�W�Ǯմ�
    const handleExpiryDateChange = (productCode, expiryDate) => {
        const updatedProducts = products.map(product => product.�ӫ~�s�� === productCode ? { ...product, �����: expiryDate } : product
        );

        setProducts(updatedProducts);
        updateExpiryDate(productCode, expiryDate);
    };


    const handleMouseEnter = (product, e) => {
        setHoveredProduct(product.�ӫ~�s��);
        const initialStockItem = initialStockData[product.�ӫ~�s��];
        setInitialStock(initialStockItem ? initialStockItem.�ƶq : 0);
        setCurrentSpec(initialStockItem ? initialStockItem.�W�� : '���]�w');
        setCurrentunit(initialStockItem ? initialStockItem.��� : '');
        const rect = e.currentTarget.getBoundingClientRect(); // �����e�ӫ~�檺���

        setTooltipPosition({ top: e.clientY + 10, left: e.clientX + 10 }); // ��s�u�㴣�ܦ�m
    };

    const handleMouseLeave = () => {
        setHoveredProduct(null); // �M���a���ӫ~
        setInitialStock(''); // �M������w�s�ƾ�
        setCurrentSpec(''); // �M���W��ƾ�
        setCurrentunit(''); // �M�����ƾ�
    };

    const toggleFunctionButtons = () => {
        setShowFunctionButtons(prev => !prev); // ������e���A
    };

    //�@��R���f�q
    const handleClearQuantities = () => {
        const updatedProducts = products.map(product => ({
            ...product,
            �ƶq: 0 // �N�Ҧ��ƶq�]�m�� 0
        }));
        setProducts(updatedProducts);

        // �o�e�ШD���ݧ�s�ƾڮw
        products.forEach(product => {
            handleQuantityChange(product.�ӫ~�s��, 0); // ���] updateQuantity ��ƳQ�w�q����s�ƶq
        });
    };
    //�@��R�����
    const handleClearExpiryDates = () => {
        const updatedProducts = products.map(product => ({
            ...product,
            �����: '' // �N�Ҧ������]�m�� null
        }));
        setProducts(updatedProducts);

        // �o�e�ШD���ݧ�s�ƾڮw�G
        products.forEach(product => {
            handleExpiryDateChange(product.�ӫ~�s��, ''); // ���] updateExpiryDate ��ƳQ�w�q����s�����
        });
    };




    //�X���ɮ�
    // �D?��
    const handleFileChange = (event, key) => {
        const file = event.target.files[0];
        if (file) {
            setFiles(prevFiles => ({ ...prevFiles, [key]: file })); // �T�O��s���T����󪬺A
        }
    };

    const uploadFiles = async () => {
        // ?�z�W?�����
        await processFiles(files);
        setUploadModalOpen(false); // ????��
    };
    // ��ܿ��~�T���� Modal
    const ErrorModal = ({ title, message }) => (
        <Modal isOpen={!!errorModal} title={title} message={message} onClose={() => setErrorModal(null)} type="error" />
    );
    return (
        <>
            {/* �T�w�����D�ϰ� */}
            <div className="inventory-header">
                <div className="fixed-header">
                    <div className="header-container">
                        <table className="header-table">
                            <thead>
                                <tr>
                                    <td colSpan="2">
                                        <h1>�w�s�L�I�t��</h1>
                                        <div>
                                            <select value={storeName} onChange={handleStoreChange}>
                                                {stores.map((store, index) => (
                                                    <option key={index} value={store}>{store}</option>
                                                ))}
                                            </select>

                                        </div>
                                    </td>
                                    <td rowSpan="2" className="header-table.right">
                                        <button className="header-button" onClick={() => setShowGuide(true)}>����</button>
                                        <button className="header-button" onClick={startInventory}>�L�I�}�l</button>
                                        <button className="header-button" onClick={() => setIsNewProductModalOpen(true)}>�s�W</button>
                                        <button id="butter-code" className="header-button" onClick={() => setIsFilterModalOpen(true)}>�z��</button>
                                        <button className="header-button" onClick={() => setIsArchiveModalOpen(true)}>�k��</button>
                                        <button className="header-button" onClick={() => setIsExportModalOpen(true)}>�ץX</button>
                                        <br />
                                        <button onClick={toggleFunctionButtons}>��h�\��</button>

                                        {showFunctionButtons && (
                                            <>
                                                <button onClick={handleClearQuantities}>�ƶq�M��</button>
                                                <button onClick={handleClearExpiryDates}>�����M��</button>
                                            </>
                                        )}


                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="header-table.left" style={{ fontSize: '1em' }}>
                                        {connectionStatus}&nbsp;&nbsp;|&nbsp;&nbsp;�b�u�@&nbsp;&nbsp;<strong>{userCount}</strong>&nbsp;&nbsp;�H&nbsp;&nbsp;|&nbsp;&nbsp;<strong>{localVersion}</strong>
                                    </td>
                                </tr>
                            </thead>
                        </table>

                        <div id="product-code">
                            <hr />
                            <div style={{ valign: 'top', textAlign: 'left', padding: '10', margin: '5' }}>
                                <label>�@�@�@<strong>�t��</strong>�G</label>
                                {allVendors.map(vendor => (
                                    <label key={vendor} className="filter-item">
                                        <input type="checkbox" checked={selectedVendors.includes(vendor)} onChange={() => handleVendorChange(vendor)} />
                                        {vendor}
                                    </label>
                                ))}<br />
                                <label>�@�@�@<strong>�w�O</strong>�G</label>
                                {['�N��', '�N��', '�`��', '�M��', '�ƫ~'].map(layer => (
                                    <label key={layer} className="filter-item">
                                        <input type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => handleLayerChange(layer)} />
                                        {layer}
                                    </label>
                                ))}</div>
                        </div>

                    </div>
                </div>
            </div>
            <div id="product-code">
                <br />
                <br />
                <br />
            </div>
            <br />
            <br />
            <br />
            <br />
            <br />
            {/* �T�w�����Y */}
            <table className="in-table">
                <thead>
                    <tr>
                        <th id="�s��" className="in-th">�ӫ~�s��</th>
                        <th className="in-th">�ӫ~�W��</th>
                        <th className="in-th">�ƶq</th>
                        <th id="���" className="in-th">���</th>
                        <th className="in-th">�����</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredProducts.map((product, index) => (
                        product.�w�O !== '���ϥ�' && (
                            <tr key={product.�ӫ~�s��}>
                                <td id="�s��" className="in-td">{product.�ӫ~�s��}</td>
                                <td id="�~�W" className="in-td" onMouseEnter={(e) => handleMouseEnter(product, e)} onMouseLeave={handleMouseLeave}>{product.�ӫ~�W��}</td>
                                <td id="�ƶq-��" className="in-td" style={{ width: '80px' }}><label><input name="�ƶq" type="number" value={product.�ƶq} onChange={(e) => handleQuantityChange(product.�ӫ~�s��, +e.target.value)} onKeyPress={event => handleKeyPress(event, index)} ref={el => inputRefs.current[index] = el} required /> &nbsp;&nbsp;{product.���}</label></td>
                                <td id="�ƶq-�T" className="in-td"><input name="�ƶq" type="number" value={product.�ƶq} onChange={(e) => handleQuantityChange(product.�ӫ~�s��, +e.target.value)} onKeyPress={event => handleKeyPress(event, index)} ref={el => inputRefs.current[index] = el} required /></td>
                                <td id="���" className="in-td">{product.���}</td>
                                <td id="�մ�" className="in-td"><input className='date' type="date" value={product.����� ? new Date(product.�����).toISOString().split('T')[0] : ""} onChange={(e) => handleExpiryDateChange(product.�ӫ~�s��, e.target.value)} /*disabled={disabledVendors.includes(product.�t��)} */ /></td>
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

                    </div>
                    <button onClick={setIsFilterModalOpen(false)}>����</button>
                </>
            )}

            {/* ���J���� */}
            {loading && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div>
                        <BouncyComponent />
                    </div>
                </div>
            )}
            {/* ��ܤu�㴣�� */}
            {hoveredProduct && (<div style={{ textAlign: 'left', fontSize: '12px', position: 'fixed', backgroundColor: 'white', border: '1px solid #ccc', padding: '5px', borderRadius: '5px', zIndex: 1000, top: tooltipPosition.top, left: tooltipPosition.left, }}>
                ����w�s�q�G{products.����w�s}{currentunit}<br />
                �W��G{currentSpec} {/* ��ܳW�� */}</div>
            )}

            {/* <InventoryUploader isOpen={isInventoryUploaderOpen} onClose={() => setIsInventoryUploaderOpen(false)} products = { products } setProducts = { setProducts } />*/}
            <InventoryUploader ref={inventoryUploaderRef} storeName={storeName} /> {/* �ǻ� storeName �� InventoryUploader */}

            {/* �u�ȴ��� */}
            {showToast && (<div style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: '#4caf50', color: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)', zIndex: 1000, }}> {newMessage} </div>
            )}
            {/* �ϥ�NewProductModal */}
            <NewProductModal isOpen={isNewProductModalOpen} onClose={() => setIsNewProductModalOpen(false)} products={products} setProducts={setProducts} />

            {/* �ϥ�ArchiveModal */}
            <ArchiveModal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} products={products} />

            {/* �ϥ�ExportModal */}
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} products={products} />


            {/* �ϥ�GuideModal */}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

            <Modal isOpen={isModalOpen} title={modalContent.title} message={modalContent.message} onClose={() => setIsModalOpen(false)} type={modalContent.type} />
            {/* �s���� */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{modalContent.title}</h2>
                        <p>{modalContent.message}</p>
                        <button onClick={handleOnline}>���㭶��</button>
                    </div>
                </div>
            )}



            <ErrorModal title={errorModal?.title} message={errorModal?.message} /> {/* ��ܿ��~�T�� Modal */}


            {/* ������u���� */}
            {isOffline && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                        <h2>�z�w���u</h2>
                        <p>���ˬd�����s�u�O�_���`�C</p>
                        <button onClick={() => window.location.reload()}>���s��z</button>
                    </div>
                </div>

            )}

            {/* ���m���ܮءA��ܭ��s�W�u���s */}
            {isReconnectPromptVisible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                        <h2>���m���_�u</h2>
                        <p>�z�w���m�W�L10�����A�Э��s�s���C</p>
                        <button onClick={handleReconnect}>���s�W�u</button>
                    </div>
                </div>
            )}
            <footer style={{ position: 'fixed', bottom: '0', left: '0', right: '0', textAlign: 'center', padding: '3px', backgroundColor: '#f5f5f5', borderTop: '1px solid #ccc' }}>
                <p style={{ margin: '0px' }}>? 2024 edc-pws.com. All rights reserved.</p>
            </footer>

        </>
    );
};
export default App;
