import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './install.js'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  // The worker is network first, so a page that loaded before it took control keeps working.
  // Reloading here would throw away anything typed in the first seconds of a first visit.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('LeasePath could not register the service worker:', error)
    })
  })
}
