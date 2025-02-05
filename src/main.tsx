import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import { Toaster } from "@/components/ui/toaster"
import Page from "@/app/dashboard/page"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
    <Page />
    <Toaster />
  </StrictMode>,
)
