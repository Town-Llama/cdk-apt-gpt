import { v4 as uuidv4 } from 'uuid';


export const setupLogger = () => {
    const originalLog = console.log;
    const originalErrorLog = console.error;

    // Retrieve the session ID
    const getSessionId = () => {
        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = uuidv4(); // or whatever logic you use to create a new session ID
            localStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    };

    // Overload console.log
    console.log = (...args) => {
        const sessionId = getSessionId();
        originalLog(`[Session ID: ${sessionId}]`, ...args);
    };

    console.error = (...args) => {
        const sessionId = getSessionId();
        originalErrorLog(`[Session ID: ${sessionId}]`, ...args);
    };

};