import { ethers } from 'ethers';
import { createContext, useContext } from 'react';


export interface EthContextProps {
    provider: ethers.providers.Web3Provider | undefined,
    signer: ethers.providers.JsonRpcSigner | undefined,
    isOnlineEth: boolean,
    signerAddress: string,
    getEventDate: (event: ethers.Event) => Promise<Date>,
}


export const EthContext = createContext<EthContextProps>({
    provider: undefined,
    signer: undefined,
    isOnlineEth: false,
    signerAddress: '',
    getEventDate: (): Promise<Date> => { throw Error("Not implemented") },
});

export const useEthContext = () => useContext<EthContextProps>(EthContext)

