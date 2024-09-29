import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * using react helmet this sets our meta tags so that the page
 * has the right SEO tags. 
 * Still waiting to confirm this works
 * @param {*} param0 
 * @returns 
 */
const SEOComponent = ({ title, description, keywords, img = null }) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={img === null ? "https://townllama.ai/imessage.png" : img} />
            <meta property="og:url" content="https://townllama.ai" />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Town Llama: Easily Find Your Next Apartment" />
        </Helmet>
    );
};

export default SEOComponent;