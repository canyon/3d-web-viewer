import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import { Toaster } from "@/components/ui/toaster"
// import Page from "@/app/dashboard/page"
import IndexPage from "@/app/dashboard/IndexPage";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
    {/* <Page /> */}
    <IndexPage />
    <Toaster />
  </StrictMode>,
)
