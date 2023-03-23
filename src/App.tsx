import useIPFS from "./components/useIPFS";
import React, { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import AdminWrapper from './admin/adminWrapper'
import ContractSelection from './admin/contract-selection'
import Deploy from './deploy'
import AuthorPage from './author'
import './index.css'
import { IPFSContext } from "./components/ipfsContext";
import { Home } from "./home";

export const App = () => {
    const [ipfs, isOnline, getFile] = useIPFS();

    return (
        <React.StrictMode>
            <IPFSContext.Provider value= {{ ipfs, isOnline, getFile }}>
                <HashRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/:authorAddress" element={<AuthorPage />} />
                        <Route path="/admin/:authorAddress" element={<AdminWrapper />} />
                        <Route path="/admin" element={<ContractSelection />} />
                        <Route path="/deploy" element={<Deploy />} />
                    </Routes>
                </HashRouter>
            </IPFSContext.Provider>
        </React.StrictMode>
    );
}