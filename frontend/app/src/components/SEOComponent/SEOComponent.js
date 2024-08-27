import React from 'react';
import { Helmet } from 'react-helmet';

const SEOComponent = ({ title, description, keywords }) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
        </Helmet>
    );
};

export default SEOComponent;