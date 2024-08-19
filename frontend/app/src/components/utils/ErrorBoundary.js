import React, { useState, useEffect } from 'react';
import CloudWatchMetrics from './AWS/CloudWatchMetrics';
import { useAuth0 } from '@auth0/auth0-react';

const useErrorBoundary = () => {
    const [error, setError] = useState(null);
    const cloudWatchMetrics = new CloudWatchMetrics('YourAppNamespace');
    const {user} = useAuth0();

    const emitError = async (error) => {
        // cloudWatchMetrics.emitErrorMetric("ErrorBoundary", "useEffect");
        // await cloudWatchMetrics.writeLog(
        //     "Error in ErrorBoundary user {"+JSON.stringify(user)+
        //     "} error {"+JSON.stringify(error)+"}");
        console.error(error);
    };

    useEffect(() => {
      const errorHandler = (event) => {
        event.preventDefault();
        setError(event.error);
        emitError(event.error);
      };
  
      window.addEventListener('error', errorHandler);
  
      return () => {
        window.removeEventListener('error', errorHandler);
      };
    }, []);
  
    return [error, setError];
  };
  
  const ErrorBoundary = ({ children }) => {
    const [error, setError] = useErrorBoundary();
  
    if (error) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded" role="alert">
            <p className="font-bold">Something went wrong</p>
            <p>{error.message || 'An unexpected error occurred'}</p>
        </div>
      );
    }
  
    return (
      <React.Fragment>
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { setError })
        )}
      </React.Fragment>
    );
  };

  export default ErrorBoundary;