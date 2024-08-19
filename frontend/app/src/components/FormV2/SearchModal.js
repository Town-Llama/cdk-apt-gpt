import React, { useState } from 'react';
import Modal from 'react-modal';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import ApartmentSearch from './ApartmentSearch';
import RestaurantSearch from './RestaurantSearch';

Modal.setAppElement('#root');

const SearchModal = ({ isOpen, onRequestClose, showLoading }) => {
    const [stage, setStage] = useState('apartment'); // 'initial', 'apartment', 'restaurant'

    const customStyles = {
        overlay: {
            zIndex: 1000,
        },
        content: {
            maxWidth: '80%',
            maxHeight: '80%',
            overflowY: 'auto', // Makes the modal scrollable if it overflows
            margin: 'auto',
            padding: '50px',
            borderRadius: '10px',
            inset: '0px',
        },
    };

    const renderInitialStage = () => (
        <div className="text-center">
            <h2 className="text-2xl font-bold gradient-text mb-4">What are you looking for?</h2>
            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => setStage('apartment')}
                    className="message-bubble text-white rounded-full py-2 px-4"
                >
                    <ApartmentIcon />
                    <br/>
                    Apartment
                </button>
                <button
                    onClick={() => setStage('restaurant')}
                    className="message-bubble text-white rounded-full py-2 px-4"
                >
                    <StorefrontIcon />
                    <br/>
                    Restaurant
                </button>
            </div>
        </div>
    );

    const renderResetButton = () => (
        <button
            onClick={() => setStage('initial')}
            className="absolute top-6 left-4 bg-red-600 text-white rounded-full p-2"
            style={{
                zIndex: 10,
            }}
        >
            <ArrowBackIcon />
        </button>
    );
    
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Search"
            className="bg-white rounded-lg shadow-lg w-11/12 md:w-8/12 max-h-full"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={customStyles}
        >
            <div className="relative">
                {/* {stage !== 'initial' && renderResetButton()} */}
                {/* {stage === 'initial' && renderInitialStage()} */}
                {stage === 'apartment' && <ApartmentSearch onRequestClose={onRequestClose} showLoading={showLoading} />}
                {/* {stage === 'restaurant' && <RestaurantSearch onBack={() => setStage('initial')} />} */}
            </div>
        </Modal>
    );
};

export default SearchModal;
