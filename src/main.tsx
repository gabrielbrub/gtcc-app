import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import AdminWrapper from './admin/adminWrapper'
import ContractSelection from './admin/contract-selection'
import Deploy from './deploy'
import Home from './home'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
     <HashRouter>
        <Routes>
            <Route path="/:authorAddress" element={<Home />} />
            <Route path="/admin/:authorAddress" element={<AdminWrapper />} />
            <Route path="/admin" element={<ContractSelection />} />
            <Route path="/deploy" element={<Deploy />} />
        </Routes>
    </HashRouter>
  </React.StrictMode>,
)
