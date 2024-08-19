import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth0 } from '@auth0/auth0-react';
import { useSelector } from 'react-redux';

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
        get();
    }, []);

    const get = async () => {
        const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
        let response = await client.chat_reviews(apt);
        setMsg(response);
        // Assuming the API also returns individual reviews
        // If not, you'd need to modify the API to fetch individual reviews
        setReviews(response.individualReviews || []);
    };

    const handleClick = () => {
        setIsModalOpen(true);
    };

    return (
        <>
            <div 
                className="cursor-pointer transition-colors duration-300 hover:text-blue-600"
                onClick={handleClick}
            >
                <ReactMarkdown 
                    className="list-disc list-inside"
                    remarkPlugins={[remarkGfm]}
                    components={{
                        ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                        li: ({node, ...props}) => <li className="mb-2 hover:text-blue-600" {...props} />
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
                                <div key={index} className="border-b pb-4 last:border-b-0">
                                    <p className="text-gray-700 mb-2">{review.text}</p>
                                    <p className="text-sm text-gray-500">- {review.author}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReviewAggregation;