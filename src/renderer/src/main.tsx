import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './theme/global.css';
import { initTauriBridge } from './services/tauriBridge';

initTauriBridge();

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
