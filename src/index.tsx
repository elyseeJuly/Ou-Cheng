import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getSettings, rehydrateStorage } from './services/storageService';
import { FONT_STYLES } from './constants';
import { initTheme } from './utils/theme';
import { initHaptics } from './utils/HapticsEngine';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const renderApp = () => {
  initHaptics();
  const settings = getSettings();
  if (settings.globalFont && settings.globalFont !== 'none') {
    document.body.style.fontFamily = FONT_STYLES[settings.globalFont]?.family || '"Ma Shan Zheng", serif';
  }
  initTheme();

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