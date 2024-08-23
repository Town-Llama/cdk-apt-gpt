import React, { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { useSelector, useDispatch } from "react-redux";
import MapSearchInput from "../../MapSearchInput/MapSearchInput";
import { SendHorizonal, MapPin, Compass, X } from "lucide-react";
import { setChatState } from '../../../store/actions/chatActions';

const InputBar = ({ onSend, setMessage, showLoading, message }) => {
    const { isAuthenticated } = useAuth0();
    const dispatch = useDispatch();
    const chat = useSelector(state => state.chat);
    const [selectedButton, setSelectedButton] = useState(null);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            showLoading(onSend);
        }
    };

    const handleInputChange = (event) => {
        setMessage(event.target.value);
    };

    const handleButtonClick = (buttonName, action) => {
        if (selectedButton === buttonName) {
            setSelectedButton(null);
            dispatch(setChatState("ANYTHING"));
        } else {
            setSelectedButton(buttonName);
            action();
        }
    };

    const changeToPOI_SEARCH = () => {
        dispatch(setChatState("POI_SEARCH"));
    };

    const changeToREPORT_FOLLOWUP = () => {
        dispatch(setChatState("REPORT_FOLLOWUP"));
    };

    const getButtonClass = (buttonName) => {
        const baseClass = "rounded-full py-2 px-4 flex items-center transition-colors duration-200";
        const selectedClass = "bg-gray-700 text-white";
        const unselectedClass = buttonName === "commute" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-green-500 text-white hover:bg-green-600";
        return `${baseClass} ${selectedButton === buttonName ? selectedClass : unselectedClass}`;
    };

    if (chat.chatState === "POI_SEARCH") {
        return (
            <div>
                {Object.keys(chat.commuteAddress).length > 0 ? (
                    <div className="mb-4 flex justify-center space-x-2">
                        <button
                            onClick={() => handleButtonClick("commute", changeToPOI_SEARCH)}
                            className={getButtonClass("commute")}
                        >
                            <MapPin className="mr-2" size={16} />
                            Change commute destination
                            {selectedButton === "commute" && (
                                <X
                                    className="ml-2 cursor-pointer"
                                    size={16}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedButton(null);
                                        dispatch(setChatState("ANYTHING"));
                                    }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => handleButtonClick("poi", changeToREPORT_FOLLOWUP)}
                            className={getButtonClass("poi")}
                        >
                            <Compass className="mr-2" size={16} />
                            Change points of interest
                            {selectedButton === "poi" && (
                                <X
                                    className="ml-2 cursor-pointer"
                                    size={16}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedButton(null);
                                        dispatch(setChatState("ANYTHING"));
                                    }}
                                />
                            )}
                        </button>
                    </div>
                ) : null}
                <MapSearchInput />
            </div>
        );
    }

    if (chat.chatState === "BEGIN") {
        return null;
    }

    return (
        <div className="bg-white border-t p-4 relative">
            <div className="max-w-3xl mx-auto flex items-center">
                <input
                    disabled={!isAuthenticated}
                    type="text"
                    placeholder={isAuthenticated ? "Ask follow up..." : "Login to use Town Llama"}
                    className="flex-1 border rounded-l-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={message}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                />
                <button className="message-bubble text-white rounded-r-full py-2 px-4" onClick={() => { showLoading(onSend) }}>
                    <SendHorizonal />
                </button>
            </div>
            {message.length == 0 && Object.keys(chat.commuteAddress).length > 0 && Object.keys(chat.poiArr).length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-4 flex justify-center space-x-2">
                    <button
                        onClick={() => handleButtonClick("commute", changeToPOI_SEARCH)}
                        className={getButtonClass("commute")}
                    >
                        <MapPin className="mr-2" size={16} />
                        Change commute destination
                        {selectedButton === "commute" && (
                            <X
                                className="ml-2 cursor-pointer"
                                size={16}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedButton(null);
                                    dispatch(setChatState("ANYTHING"));
                                }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleButtonClick("poi", changeToREPORT_FOLLOWUP)}
                        className={getButtonClass("poi")}
                    >
                        <Compass className="mr-2" size={16} />
                        Change points of interest
                        {selectedButton === "poi" && (
                            <X
                                className="ml-2 cursor-pointer"
                                size={16}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedButton(null);
                                    dispatch(setChatState("ANYTHING"));
                                }}
                            />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default InputBar;