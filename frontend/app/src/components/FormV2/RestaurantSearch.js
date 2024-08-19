import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './RestaurantSearch.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import AptGptUtility from '../utils/API/AptGptUtility';


const RestaurantSearch = ({ onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('current');
    const [placeholders, setPlaceholders] = useState([
        "Where is the best Italian food near me?",
        "Vegan options near my location",
        "Best value for money restaurants nearby",
        "Fun restaurants with outdoor seating"
    ]);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

    const {
        user, isAuthenticated, getAccessTokenSilently
    } = useAuth0();

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholders(prevPlaceholders => {
                const [first, ...rest] = prevPlaceholders;
                return [...rest, first];
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(()=>{
        const process = async () => {
            const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
            const neighborhoodsList = await client.datas_neighborhoods("Austin");
            setNeighborhoods([ {name: "Use My Current Location", }, ...neighborhoodsList]);
        }
        process();
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (err) => {
                    // setError(err.message); // alerts us
                }
            );
        } else {
            // setError('Geolocation is not supported by your browser.');
        }
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery, 'in', selectedNeighborhood);
    };

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold gradient-text mb-4">Restaurant Search</h2>
            <form onSubmit={handleSearch} className="mb-4">
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
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={placeholders[0]}  // Fallback for non-JS environments
                        className={`${styles.input} w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Search className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
                <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {neighborhoods.map((neighborhood) => (
                        <option key={neighborhood.name} value={neighborhood.name}>
                            {neighborhood.name}
                        </option>
                    ))}
                </select>
            </form>
            <button
                onClick={onBack}
                className="mt-4 message-bubble text-white rounded-full py-2 px-4"
            >
                Search
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 inline-block mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>
        </div>
    );
};

export default RestaurantSearch;
