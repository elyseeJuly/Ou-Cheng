import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getSettings, rehydrateStorage } from './services/storageService';
import { FONT_STYLES } from './constants';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const renderApp = () => {
  const settings = getSettings();
  if (settings.globalFont && settings.globalFont !== 'none') {
    document.body.style.fontFamily = FONT_STYLES[settings.globalFont]?.family || '"Ma Shan Zheng", serif';
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Rehydrate LocalStorage from IndexedDB before rendering
rehydrateStorage().then(renderApp).catch((err) => {
  console.error("Rehydration failed, rendering anyway:", err);
  renderApp();
});
