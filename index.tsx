import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler to catch initialization errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global error caught:", message, error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: #ff6b6b; background: #1a0b2e; font-family: serif; text-align: center;">
        <h2 style="text-transform: uppercase;">Oscurità Inattesa</h2>
        <p>Un errore arcano ha impedito il caricamento dell'interfaccia.</p>
        <pre style="font-size: 10px; color: #8e5cd9; margin-top: 20px;">${message}</pre>
        <button onclick="window.location.reload()" style="background: #4c2a85; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">Riprova il Rituale</button>
      </div>
    `;
  }
};

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e: any) {
  console.error("Mount error:", e);
  rootElement.innerHTML = `<div style="color: red; padding: 20px;">Errore di montaggio: ${e.message}</div>`;
}