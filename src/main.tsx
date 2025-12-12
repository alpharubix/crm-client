import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import App from './App.tsx'
import './index.css'
import { router } from './router/index.ts'

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <RouterProvider router={router} />,
  </>
)
