import { IPFSHTTPClient } from 'ipfs-http-client';
import { createContext, useContext } from 'react';



export interface IPFSContextProps {
    ipfs: IPFSHTTPClient | null,
    isOnline: boolean,
    getFile: (cid: string) => Promise<File>
}


export const IPFSContext = createContext<IPFSContextProps>({
    ipfs: null,
    isOnline: false,
    getFile: (): Promise<File> => { throw Error() }
});

export const useIPFSContext = () => useContext<IPFSContextProps>(IPFSContext)

