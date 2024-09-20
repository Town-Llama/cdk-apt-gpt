import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './RestaurantSearch.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import AptGptUtility from '../utils/API/AptGptUtility';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { updateDFPayload } from '../../store/actions/dfActions';
import { updateFormDataPayload } from '../../store/actions/formDataActions';
import { setRecHash } from "../../store/actions/recActions";
import { clearChat } from '../../store/actions/chatActions';
import { advance } from '../utils/ChatFlow';
import { trackButtonClick, trackFilledInput } from '../utils/analytics';

const RestaurantSearch = ({ onRequestClose, showLoading }) => {
    const [placeholders, setPlaceholders] = useState([
        "Where is the best Italian food near me?",
        "Vegan options near my location",
        "Best value for money restaurants nearby",
        "Fun restaurants with outdoor seating"
    ]);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

    const { control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            query: "",
            neighborhood: 0,
        }
    });

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const dispatch = useDispatch();

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholders(prevPlaceholders => {
                const [first, ...rest] = prevPlaceholders;
                return [...rest, first];
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchNeighborhoods = async () => {
            const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
            const neighborhoodsList = await client.datas_neighborhoods("Austin");
            setNeighborhoods([{ name: "Use My Current Location" }, ...neighborhoodsList]);
        };
        fetchNeighborhoods();
    }, [getAccessTokenSilently, isAuthenticated, user]);

    useEffect(() => {
        getUserCoordinates();
    }, []);

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
        if (formData.neighborhood == 0) {
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
        //we have the data, let's get the information!

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
            <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
                <div className="relative">
                    <div className={`${styles['placeholder-container']} h-12`}>
                        {placeholders.map((placeholder, index) => (
                            <div
                                key={placeholder}
                                className={styles['placeholder-item']}
                                style={{ transform: `translateY(-${index * 100}%)` }}
                            >
                                {placeholder}
                            </div>
                        ))}
                    </div>
                    <Controller
                        name="query"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder={placeholders[0]}
                                className={`${styles.input} w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
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