import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './context/i18n';
import { NetworkProvider } from './context/NetworkContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <NetworkProvider>
        <App />
      </NetworkProvider>
    </I18nProvider>
  </React.StrictMode>
);