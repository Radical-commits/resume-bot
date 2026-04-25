import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'

const root = ReactDOM.createRoot(document.getElementById('root')!)

if (window.location.pathname.startsWith('/admin')) {
  import('./admin/AdminApp').then(({ AdminApp }) => {
    root.render(
      <React.StrictMode>
        <AdminApp />
      </React.StrictMode>
    )
  })
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
