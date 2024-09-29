import React, { useEffect, useState } from 'react';
import { MapPin, ArrowLeft, Star, Utensils, Clock, Phone, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useAuth0 } from "@auth0/auth0-react";
import { trackButtonClick } from '../utils/analytics';
import { Buffer } from 'buffer';

import { updateDFIndex } from '../../store/actions/dfActions';
import AccordionItem from './AccordionItem/AccordionItem';
import AptGptUtility from '../utils/API/AptGptUtility';

/**
 * class used to tell the user more about the place. This is accessible
 * both directly from the internet (Google Links) and also when the 
 * user goes through a chat and sees a recommendation
 * @param {*} param0 
 * @returns 
 */
const PublicView = ({ id }) => {
    const dispatch = useDispatch();
    const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();

    console.log("ID", id);

    const [place, setPlace] = useState({});
    const [menu, setMenu] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [images, setImages] = useState(null);
    const [showGallery, setShowGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    /**
     * fetching information from the fetch_apt api route
     * we are dropping all previous routes so we do not
     * wait for calls that will no longer appear on the 
     * page to load
     */
    useEffect(() => {
        const fetchData = async () => {
            console.log("INSIDE");
            const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
            client.drop_all_previous_requests();
            const data = await client.datas_fetch_apt(id);
            setPlace(data.bar[0]);
            setMenu(data.menu);
            setReviews(data.reviews || []);
            setImages(data.image || []);
        };
        console.log("HIT effect");
        fetchData();
    }, []);

    /**
    * handles the logic for the back button
    * if the user is NOT on the "/" url then we
    * assume they got here from google & are not logged in
    * otherwise we will update the DF and send them back
    * to the chat
     */
    const goBack = () => {
        if (window.location.pathname === "/") {
            dispatch(updateDFIndex(null));
        } else {
            window.location.href = "/";
        }
    };

    const calculatePriceRange = () => {
        if (menu.length === 0) return 'N/A';
        const prices = menu
            .map(item => item.price)
            .filter(price => price !== "-1.00")
            .map(price => parseFloat(price));

        if (prices.length === 0) return 'N/A';

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }

    const groupMenuByCategory = () => {
        return menu.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});
    }

    const calculateAveragePriceByCategory = (categoryItems) => {
        console.log(categoryItems, "CI")
        const prices = categoryItems.map(item => item.price)
            .filter(price => price !== "-1.00")
            .map(price => parseFloat(price));

        if (prices.length === 0) {
            return `No Prices Listed`;
        }

        const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        return `Avg: $${average.toFixed(2)}`;
    }

    const email = () => {
        trackButtonClick("ViewV2_Directions", user ? user.sub : "public");
        const googleMapsBaseUrl = 'https://www.google.com/maps/dir//';
        const directionsUrl = `${googleMapsBaseUrl}${encodeURIComponent([place.barname + "--" + place.address])}`;
        window.location.href = directionsUrl;
    }

    const groupedMenu = groupMenuByCategory();
    const openGallery = (index) => {
        setCurrentImageIndex(index);
        setShowGallery(true);
    }

    const closeGallery = () => {
        setShowGallery(false);
    }

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    }

    const imgSrc = (index) => {
        return images === null ? "/maps.webp" : "data:image/" + images[index].filetype + ";base64," + Buffer.from(images[index].image_data).toString('base64');
    }

    return (
        <div className="font-sans bg-gradient-to-b from-[#0099ff] to-[#0062ff] min-h-screen text-white">
            <div className="max-w-6xl mx-auto p-4">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div onClick={goBack} className="cursor-pointer mb-4">
                        <ArrowLeft size={24} className="text-white hover:text-blue-200" />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-2 text-center">{place.barname}</h1>
                    <div className="flex items-center justify-center mb-4">
                        <MapPin className="mr-2 text-blue-200" size={20} />
                        <span className="text-lg">{place.address}</span>
                    </div>
                    <p className="text-2xl font-semibold mb-4 text-center">Price Range: {calculatePriceRange()}</p>
                    <button onClick={() => email()} className="w-full bg-white text-[#0062ff] py-3 px-6 rounded-full text-xl font-bold hover:bg-blue-100 transition duration-300 ease-in-out transform hover:scale-105">
                        Get Directions
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-8"
                >
                    <div
                        className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg cursor-pointer"
                        onClick={() => images !== null && images.length > 0 && openGallery(0)}
                    >
                        {images !== null && images.length > 0 ? (
                            <img
                                src={imgSrc(0)}
                                alt={`${place.barname} photo`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={"/maps.webp"}
                                alt={`${place.barname} photo`}
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                            <h2 className="text-xl font-bold">{place.barname}</h2>
                            <p className="text-sm">{place.address}</p>
                        </div>
                    </div>
                </motion.div>


                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white bg-opacity-10 p-6 rounded-lg shadow-lg"
                    >
                        <h2 className="text-3xl font-bold mb-6 flex items-center">
                            <Utensils className="mr-2 text-blue-200" size={24} />
                            Menu
                        </h2>
                        {Object.entries(groupedMenu).map(([category, items], index) => (
                            <AccordionItem
                                key={index}
                                title={`${category} (${calculateAveragePriceByCategory(items)})`}
                                content={
                                    <ul className="space-y-4">
                                        {items.map((item, itemIndex) => (
                                            <li key={itemIndex} className="border-b border-blue-300 pb-2">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-semibold">{item.itemname}</span>
                                                    <span className="text-lg">
                                                        {item.price == "-1.00" ? "Price Not Listed" : "$" + parseFloat(item.price).toFixed(2)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-blue-100">{item.itemdescription}</p>
                                            </li>
                                        ))}
                                    </ul>
                                }
                            />
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-white bg-opacity-10 p-6 rounded-lg shadow-lg"
                    >
                        <h2 className="text-3xl font-bold mb-6 flex items-center">
                            <Star className="mr-2 text-blue-200" size={24} />
                            Reviews
                        </h2>
                        {reviews.map((review, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="bg-[#0062ff] bg-opacity-50 p-4 rounded-lg mb-4"
                            >
                                <div className="flex items-center mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`${i < review.rating ? 'text-blue-200' : 'text-blue-800'} mr-1`} size={16} />
                                    ))}
                                    <span className="font-bold ml-2">{review.rating}/5</span>
                                </div>
                                <p className="text-sm mb-2">{review.review_text}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                    <AnimatePresence>
                        {showGallery && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
                            >
                                <button
                                    onClick={closeGallery}
                                    className="absolute top-4 right-4 text-white hover:text-gray-300"
                                >
                                    <X size={32} />
                                </button>
                                {
                                    images.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 text-white hover:text-gray-300"
                                            >
                                                <ChevronLeft size={48} />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 text-white hover:text-gray-300"
                                            >
                                                <ChevronRight size={48} />
                                            </button>
                                        </>
                                    )
                                }
                                <img
                                    src={imgSrc(currentImageIndex)}
                                    alt={`${place.barname} photo ${currentImageIndex + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                                <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div >
        </div >
    );
};

export default PublicView;