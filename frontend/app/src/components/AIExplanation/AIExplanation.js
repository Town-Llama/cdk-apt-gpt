import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth0 } from '@auth0/auth0-react';
import { useSelector } from 'react-redux';

import AptGptUtility from '../utils/API/AptGptUtility';
import styles from './AIExplanation.module.css'; // Import the CSS module


const AIExplanation = ({ showOnLoad = false, apt, short = false }) => {
    const [msg, setMsg] = useState("Loading...");
    const [loading, setLoading] = useState(true);
    const [getSuggestion, setGetSuggestion] = useState(showOnLoad);

    const payload = useSelector(state => state.chat.query);

    const {
        user,
        isAuthenticated,
        getAccessTokenSilently
    } = useAuth0();

    useEffect(() => {
        if (showOnLoad) {
            get();
        }
    }, [])

    const get = async () => {
        console.log(payload, "OKr");
        setGetSuggestion(true);
        const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
        let response;
        if (!short) {
            response = await client.chat_suggestion(apt, payload);
        } else {
            response = await client.chat_suggestion_short(apt, payload);
        }
        setLoading(false);
        setMsg(response);
    }

    useEffect(() => {
        if (loading) {
            const texts = ['Rounding up the Llamas...', 'Reviewing Our Options...', 'Doing Our Due Dilligence...', "We're on the Case...", "Llama-king Progress...", "Sifting Through the Herd..."];
            let index = 0;
            const interval = setInterval(() => {
                setMsg(texts[index]);
                index = (index + 1) % texts.length;
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [loading]);

    return (
        <div>
            {!getSuggestion ? (
                <button onClick={get}>
                    Why should I check this out?
                </button>
            ) : (
                <>
                    <p>Why Did Town Llama pick this for you:</p>
                    <ReactMarkdown
                        className={styles.list}
                        remarkPlugins={remarkGfm}
                        components={{
                            ul: ({ node, ...props }) => <ul className={styles.list} {...props} />,
                            li: ({ node, ...props }) => <li className={styles['list-item']} {...props} />
                        }}
                    >
                        {msg}
                    </ReactMarkdown>
                </>

            )}
        </div>
    );


};

export default AIExplanation;