import { useState } from "react";
import SettingsModal from "./settingsModal";
import useIPFS from "./useIPFS";

export const IpfsButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ipfs, isOnline, getFile] = useIPFS();

    return (
        <>
            <SettingsModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}></SettingsModal>
            <div className='flex flex-row mt-1 items-center cursor-pointer'
                onClick={() => { setIsModalOpen(true) }}
            >
                <span className='pr-[4px]'>IPFS</span>
                {isOnline ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>}
            </div>
        </>

    );
}