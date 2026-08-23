import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import './styles.css';
import './hardening.css';
import './auth.css';
import './auth-fixes.css';
import './admin.css';
import './completion.css';
import './admin-completion.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
