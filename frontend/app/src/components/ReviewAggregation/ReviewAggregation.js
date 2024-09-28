import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth0 } from '@auth0/auth0-react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Star, Utensils, Clock, Phone } from 'lucide-react';

import AptGptUtility from '../utils/API/AptGptUtility';

const ReviewAggregation = ({ apt }) => {
    const [msg, setMsg] = useState("Loading...");
    const [reviews, setReviews] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { payload } = useSelector(state => state.formData);

    const {
        user,
        isAuthenticated,
        getAccessTokenSilently
    } = useAuth0();

    useEffect(() => {
        setMsg(apt.reviewsMessage.review_text);
        setReviews(apt.reviews);
    }, []);

    const handleClick = () => {
        setIsModalOpen(true);
    };

    return (
        <>
            <div
                style={{
                    borderTop: "1px solid #a4a5a6"
                }}
                className="cursor-pointer transition-colors duration-300 hover:text-blue-600"
                onClick={handleClick}
            >
                <p>What did Town Llama Think of the Reviews:</p>
                <ReactMarkdown
                    className="list-disc list-inside"
                    remarkPlugins={[remarkGfm]}
                    components={{
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-2 hover:text-blue-600" {...props} />
                    }}
                >
                    {msg}
                </ReactMarkdown>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Individual Reviews</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
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
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReviewAggregation;