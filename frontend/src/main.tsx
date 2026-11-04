import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import './assets/styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  </StrictMode>
)
