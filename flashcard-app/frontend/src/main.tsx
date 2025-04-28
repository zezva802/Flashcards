import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';  // Make sure your main CSS file is imported

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found. Did you forget to add `<div id='root'></div>` in your `index.html`?");
}
