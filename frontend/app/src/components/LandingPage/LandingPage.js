import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamoDBUtil from '../utils/AWS/DynamoDBUtil';

import './LandingPage.css';
import { Button } from 'semantic-ui-react';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ddbClient = new DynamoDBUtil();
    try {
        await ddbClient.save_email_list({email});
    }
    catch (e) {
        console.error(e);
    }
    alert('Thank you for your interest! We will contact you soon.');
    setEmail('');
  };

  return (
    <div className="landing-page">
      <div className="overlay">
        <header className="header">
          <h1 className="title">Town Llama</h1>
          <h2 className="subtitle">Find Your Perfect Apartment in Austin</h2>
        </header>
        <section className="overview">
        <Button 
          onClick={()=>navigate("/form")}
          style={{"background-color": "#be353f", "color": "#fff"}}>
          Check it out
        </Button>
          <h3 className="section-title">How It Works</h3>
          <p className="section-content">
            Town Llama uses advanced AI technology to match you with the best apartments in Austin based on your preferences and needs. Our process is simple and efficient:
          </p>
          <ul className="steps-list">
            <li>1. Tell us your preferences.</li>
            <li>2. Our AI searches thousands of listings.</li>
            <li>3. Get personalized recommendations.</li>
            <li>4. Visit and choose your new home!</li>
          </ul>
        </section>
        <section className="signup">
          <h3 className="section-title">Stay Informed</h3>
          <p className="section-content">Enter your email to get updates and more information:</p>
          <form className="email-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Sign Up</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
