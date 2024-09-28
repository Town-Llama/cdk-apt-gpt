import React, { useState, useEffect } from 'react';
import styles from './RestaurantSearch.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import AptGptUtility from '../utils/API/AptGptUtility';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { advance } from '../utils/ChatFlow';
import { trackButtonClick, trackFilledInput } from '../utils/analytics';

const RestaurantSearch = ({ onRequestClose, showLoading }) => {
    const [placeholders, setPlaceholders] = useState([
        "Where is the best Italian food near me?",
        "Vegan options near my location",
        "Best value for money restaurants nearby",
        "Fun restaurants with outdoor seating"
    ]);
    const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [isGeolocationAvailable, setIsGeolocationAvailable] = useState(true);
    const [showLocationAlert, setShowLocationAlert] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);


    const { control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            query: "",
            neighborhood: 0,
        }
    });

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const dispatch = useDispatch();

    const queryValue = watch("query");

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isInputFocused && !queryValue) {
                setCurrentPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [placeholders.length, isInputFocused, queryValue]);

    useEffect(() => {
        const fetchNeighborhoods = async () => {
            const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
            const neighborhoodsList = await client.datas_neighborhoods("Austin");
            setNeighborhoods(neighborhoodsList);
        };
        fetchNeighborhoods();
        checkGeolocationAvailability();
    }, [getAccessTokenSilently, isAuthenticated, user]);

    const checkGeolocationAvailability = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    setIsGeolocationAvailable(true);
                    setNeighborhoods(prev => [{ name: "Use My Current Location" }, ...prev]);
                },
                () => {
                    setIsGeolocationAvailable(false);
                    setShowLocationAlert(true);
                }
            );
        } else {
            setIsGeolocationAvailable(false);
            setShowLocationAlert(true);
        }
    };

    const getUserCoordinates = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const coords = [
                            position.coords.latitude,
                            position.coords.longitude,
                        ];
                        resolve(coords);
                    },
                    (err) => {
                        console.error("Error getting user location:", err);
                        reject(err);
                    }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
                reject(new Error("Geolocation not supported"));
            }
        });
    };

    const callAPI = async (data) => {
        const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
        return await client.datas_search(data);
    };

    const onSubmit = async (formData) => {
        console.log(formData, neighborhoods[formData.neighborhood]);
        let coordinatesArr;
        if (formData.neighborhood == 0 && isGeolocationAvailable) {
            coordinatesArr = await getUserCoordinates();
        } else {
            coordinatesArr = neighborhoods[parseInt(formData.neighborhood)].coordinates;
        }

        console.log(coordinatesArr, formData.neighborhood);

        const matches = await showLoading(callAPI, {
            max_distance: 5,
            coordinates: { lat: coordinatesArr[0], lng: coordinatesArr[1] },
            query: formData.query,
        });

        console.log(matches, 'df');
        dispatch(advance(formData.query, matches, "SEARCH"));
        onRequestClose();
    };

    const handleNeighborhoodChange = (value) => {
        if (value) {
            trackFilledInput('FormV2_Neighborhood', isAuthenticated ? user.sub : null);
        }
    };

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold gradient-text mb-4">Town Llama help me find...</h2>
            {showLocationAlert && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Location Unavailable</p>
                    <p>We couldn't access your location. Please select a neighborhood from the list.</p>
                </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
                <div className="relative">
                    {!isInputFocused && !queryValue && (
                        <div className={`${styles['placeholder-container']} h-12 overflow-hidden absolute top-0 left-0 w-full pointer-events-none`}>
                            {placeholders.map((placeholder, index) => (
                                <div
                                    key={placeholder}
                                    className={`${styles['placeholder-item']} absolute w-full transition-transform duration-300 ease-in-out`}
                                    style={{
                                        transform: `translateY(${(index - currentPlaceholderIndex) * 100}%)`,
                                        opacity: index === currentPlaceholderIndex ? 1 : 0
                                    }}
                                >
                                    {placeholder}
                                </div>
                            ))}
                        </div>
                    )}
                    <Controller
                        name="query"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                className={`${styles.input} w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                            />
                        )}
                    />
                </div>
                <Controller
                    name="neighborhood"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <select
                            {...field}
                            onChange={(e) => {
                                field.onChange(e);
                                handleNeighborhoodChange(e.target.value);
                            }}
                            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {neighborhoods.map((neighborhood, index) => (
                                <option key={neighborhood.name} value={index}>
                                    {neighborhood.name}
                                </option>
                            ))}
                        </select>
                    )}
                />
                <button
                    type="submit"
                    className="mt-4 message-bubble text-white rounded-full py-2 px-4"
                    onClick={() => trackButtonClick('RestaurantSearch_Submit', isAuthenticated ? user.sub : null)}
                >
                    Search
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 inline-block ml-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default RestaurantSearch;