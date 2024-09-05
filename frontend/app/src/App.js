import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Dimmer, Loader } from 'semantic-ui-react';

import ChatV2 from "./components/ChatV2/ChatV2";
import SEOComponent from './components/SEOComponent/SEOComponent';
import ErrorBoundary from './components/utils/ErrorBoundary';

import 'semantic-ui-css/semantic.min.css';
import './App.css';
import BlogTemplate from './components/BlogTemplate/BlogTemplate';

// Home component with its own SEO
const Home = ({ showLoading }) => (
  <>
    <SEOComponent
      title="TownLlama"
      description="TownLlama: Easily Find Your Next Apartment"
      keywords="apartment finder,AI-powered apartment search,home search engine,rental property search,apartment recommendations,personalized apartment matches,affordable apartments near me,luxury apartments for rent,apartment deals and discount,AI-driven apartment suggestions,Austin Texas Rentals, Austin Rentals, ATX Rentals,student apartments for rent,apartment search for professionals,family-friendly apartments near me,senior living apartments,pet-friendly apartments,studio apartment search,1 bedroom apartment rentals,2 bedroom apartment deals,3 bedroom house rentals,luxury high-rise apartments,apartment search engine with AI,home search platform for renters,real estate market analysis tool,AI-powered apartment matching service"
    />
    <ChatV2 showLoading={showLoading} />
  </>
);

// Blog component with its own SEO
const Blog = ({ showLoading }) => {
  // If no id is provided, generate a random one
  const { id } = useParams();  // Use useParams to get the id from the URL
  const blogId = id;
  return (
    <div className="blog-container bg-gray-50 min-h-screen px-4">
      <h1 className="message-bubble fixed top-0 left-0 right-0 bg-gray-900 text-white text-3xl font-bold p-4 z-50 shadow-md">
        <a href="/blog" className="no-underline text-white">🦙 Town Llama Blog</a>
      </h1>
      <div className="pt-20"> {/* Add padding to account for the fixed header */}
        <BlogTemplate id={blogId} showLoading={showLoading} />
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");

  const showLoading = async (fn, ...args) => {
    if (typeof fn === 'function') {
      setLoading(true);
      const result = await fn(...args);
      setLoading(false);
      return result;
    } else {
      throw new Error('The provided parameter is not a function');
    }
  }

  useEffect(() => {
    if (loading) {
      const texts = ['Rounding up the Llamas...', 'Grazing on Ideas...', 'Flocking to a Conclusion...', 'Mowing Through the Details...', 'Llama-nating New Opportunities...', 'Bringing Home the Bacon...', 'Spinning a Web of Solutions...', "Running out of puns :)"];
      let index = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[index]);
        index = (index + 1) % texts.length;
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [loading]);

  return (
    <div className="App">
      <ErrorBoundary>
        <Dimmer active={loading} page>
          <Loader active={loading} inline='centered'>
            🦙
            <br />
            {loadingText}
          </Loader>
        </Dimmer>
        <Routes>
          <Route path="/" element={<Home showLoading={showLoading} />} />
          <Route
            path="/blogs/:id"
            element={<Blog showLoading={showLoading} />}
          />
          <Route path="/blogs" element={<Blog showLoading={showLoading} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
