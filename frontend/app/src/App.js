import React, {useState, useEffect} from 'react';
import { Navigate, Route, Routes, useLocation} from 'react-router-dom';
import { Loader, Dimmer } from 'semantic-ui-react';

import ChatV2 from "./components/ChatV2/ChatV2";
import ErrorBoundary from './components/utils/ErrorBoundary';

import './App.css';
import 'semantic-ui-css/semantic.min.css';
import LandingPage from './components/LandingPage/LandingPage';


function App() {

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");
  const [msgs, setMsgs] = useState([]);
  const location = useLocation();
  const [seen, setSeen] = useState(1);

  const showLoading = async (fn, ...args) => {
    if (typeof fn === 'function') {
      setLoading(true);
      const result = await fn(...args)
      setLoading(false);
      return result;
    } else {
      throw new Error('The provided parameter is not a function');
    }
  }

  useEffect(() => {
    if (loading) {
      const texts = ['Rounding up the Llamas...', 'Grazing on Ideas...', 'Flocking to a Conclusion...', 'Mowing Through the Details...',  'Llama-nating New Opportunities...', 'Bringing Home the Bacon...', 'Spinning a Web of Solutions...', "Running out of puns :)"];
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
          <br/>
          {loadingText}
        </Loader>
      </Dimmer>
      <Routes>
        <Route path="/" element={<ChatV2 showLoading={showLoading}/>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
