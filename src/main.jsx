import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Used to confirm the live site has the latest frontend build
window.__POSTAFLY_BUILD__ = '2026-08-23-template-preview';
console.info('[PostaFly] frontend build:', window.__POSTAFLY_BUILD__);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
