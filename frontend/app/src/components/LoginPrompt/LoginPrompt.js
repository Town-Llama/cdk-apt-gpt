import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { trackButtonClick } from '../utils/analytics';

const LoginPrompt = ({ isAuthenticated, waitlistApproved, isLoading }) => {
  const [loadingText, setLoadingText] = useState('Logging You In...');
  const { loginWithRedirect } = useAuth0();

  const click = () => {
    trackButtonClick('Login');
    loginWithRedirect();
  }

  useEffect(() => {
    if (isLoading) {
      const texts = ['Logging You In...', 'Rounding up the Llamas...', 'Reviewing Our Options...', 'Doing Our Due Dilligence...', 'Reviewing the Pasture for Opportunities...', 'Checking in with Our Llama Experts...'];
      let index = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[index]);
        index = (index + 1) % texts.length;
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Town Llama!</h2>
            <button
              onClick={() => click()}
              className="w-full message-bubble text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Log in
            </button>
            <h4 className="text-lg font-medium text-gray-700 mt-6 mb-3">What We Do</h4>
            <ul className="space-y-2">
              {['See Only the Best Apartments For You', 'Compare Commute Times for Each Place', 'Compare nearby places of interest'].map((item, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{loadingText}</h2>
        </div>
      </div>
    );
  }

  if (!waitlistApproved) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">You're on the Waitlist!</h2>
          <p className="text-gray-600">Check Back Soon!</p>
        </div>
      </div>
    );
  }

  return null;
};

export default LoginPrompt;
