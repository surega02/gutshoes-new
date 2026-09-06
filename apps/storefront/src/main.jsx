import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import './assets/styles/styles.css';
import './assets/styles/hardening.css';
import './assets/styles/auth.css';
import './assets/styles/auth-fixes.css';
import './assets/styles/completion.css';
import './assets/styles/theme.css';
import './assets/styles/motion.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
