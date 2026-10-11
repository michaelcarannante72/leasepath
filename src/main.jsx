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
  const hadController = Boolean(navigator.serviceWorker.controller)
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('LeasePath could not register the service worker:', error)
    })
  })
  if (!hadController) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    }, { once: true })
  }
}
