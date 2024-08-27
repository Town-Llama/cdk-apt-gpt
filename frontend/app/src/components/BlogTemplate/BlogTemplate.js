import React, { useState, useEffect, useCallback } from 'react';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import AptGptUtility from '../utils/API/AptGptUtility';
import SEOComponent from '../SEOComponent/SEOComponent';

const BlogTemplate = ({ id, showLoading }) => {
    const [blogData, setBlogData] = useState({
        title: "",
        content: "",
        description: "",
        keywords: ""
    });

    const fetchBlogData = useCallback(async () => {
        const client = new AptGptUtility();
        const data = await client.blog(id);
        setBlogData(data);
    }, [id]);

    useEffect(() => {
        showLoading(fetchBlogData);
    }, [id]);

    // Custom renderer for paragraphs and headings
    const renderers = {
        p: ({ children }) => <p className="mb-6 text-gray-700 leading-relaxed">{children}</p>,
        h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-6 text-gray-700">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-6 text-gray-700">{children}</ol>,
        li: ({ children }) => <li className="mb-2">{children}</li>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6 text-gray-600">{children}</blockquote>,
    };

    const { title, content, description, keywords } = blogData;

    return (
        <div className="min-h-screen bg-gray-100">
            <SEOComponent
                title={title ? `${title} | TownLlama` : "TownLlama"}
                description={description}
                keywords={keywords}
            />
            <div className="container mx-auto px-4 py-8">
                <div style={{ textAlign: "left" }} className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    <img src="/parks.webp" alt="Blog header" className="w-full object-cover object-center" />
                    <div className="p-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-6">{title}</h1>
                        <div className="prose max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={renderers}
                            >
                                {content.replace(/\\n/g, '\n')}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogTemplate;