import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Disable console.log in production
if (process.env.NODE_ENV === 'production') {
    console.log = () => { };
    console.debug = () => { };
    console.info = () => { };
    // Keep console.error and console.warn for critical issues
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
