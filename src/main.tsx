import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

function validateEnv() {
    const required = ['VITE_YOUTUBE_CLIENT_ID', 'VITE_YOUTUBE_API_KEY'];
    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

validateEnv();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)