import { ethers } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { promiseWithTimeout } from '../utils';
import { useSessionStorage } from 'usehooks-ts';

export const useEth = (requestSigner: boolean = true): [ethers.providers.Web3Provider |
  undefined, ethers.providers.JsonRpcSigner | undefined, boolean, string, (event: ethers.Event) => Promise<Date>] => {

  const [isOnlineEth, setIsOnlineEth] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [signerAddress, setSignerAddress] = useSessionStorage<string>("@gtcc-signer-address", '');
  const signerRef = useRef<ethers.providers.JsonRpcSigner | null>(null);


  useEffect(() => {
    const asyncFunc = async () => {
      if (signer) {
        setSignerAddress(await signer.getAddress());
      } else {
        setSignerAddress('');
      }
    }
    asyncFunc();
  }, [signer]);


  async function getEventDate(event: ethers.Event): Promise<Date> {
    const blockNumber = event.blockNumber;
    if (!blockNumber) {
      throw new Error('Block number not available for this event.');
    }
  
    const block = await provider!.getBlock(blockNumber);
    const timestamp = block.timestamp;
  
    const date = new Date(timestamp * 1000);
  
    return date;
  }

  const connectToProvider = (): ethers.providers.Web3Provider | undefined => {
    if (typeof window.ethereum !== "undefined" && provider === undefined) {
      console.log("connecting to provider...");
      let providerLocal = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      setProvider(providerLocal);
      console.log("connected to provider");
      return providerLocal;
    }
  }

  const connectToSigner = async (providerParam?: ethers.providers.Web3Provider): Promise<ethers.providers.JsonRpcSigner | undefined> => {
    console.log('connecting to signer...');
    if (requestSigner) {
      if (provider || providerParam) {
        const providerPick = providerParam || provider;
        try {
          await promiseWithTimeout<number>(providerPick!.getBlockNumber(), 15000);
          console.log(`Connected to ethereum blockchain`);
          await providerPick!.send('eth_requestAccounts', []);
          let signerLocal = providerPick!.getSigner();
          setSigner(signerLocal);
          signerRef.current = signerLocal;
          setIsOnlineEth(true);
          return signerLocal;
        } catch (error) {
          console.error(`Not connected to ethereum network: ${error}`);
          setSigner(undefined);
          signerRef.current = null;
          setIsOnlineEth(false);
          if (requestSigner) {
            connectToSigner();
          }
        }
      } else {
        connectToProvider();
        console.warn('ethers not found');
      }
    }
    return undefined;
  };


  const handleAccountsChanged = async (newProvider:ethers.providers.Web3Provider | undefined , accounts: string[]) => {
    if (newProvider) {
      const newSigner = await connectToSigner(newProvider);
      console.log('Wallet address changed to: ' + accounts[0]);
      const newSignerAddress = await newSigner?.getAddress();
      if (newSigner && newSignerAddress) {
        setSignerAddress(newSignerAddress);
        setSigner(newSigner);
        signerRef.current = newSigner;
      }
    }
  };
  
  useEffect(() => {
    const newProvider = connectToProvider();
    if (requestSigner) {
      connectToSigner(newProvider);
    }
  
    const handleNewAccounts = (accounts: string[]) => {
      handleAccountsChanged(newProvider, accounts);
    };
  
    window.ethereum.on('accountsChanged', handleNewAccounts);
    return () => window.ethereum.removeListener('accountsChanged', handleNewAccounts);
  }, []);

  useEffect(() => {
    if (provider) {
      const interval = setInterval(async () => {
        if (provider) {
          try {
            await promiseWithTimeout<number>(provider.getBlockNumber(), 15000);
            console.log(`Connected to ethereum blockchain`);
            if (signerRef.current) {
              setIsOnlineEth(true);
            } else {
              console.log("NCTSIGNER");
              connectToSigner();
            }
          } catch (error) {
            console.error(`Not connected to ethereum network: ${error}`);
            setSigner(undefined);
            signerRef.current = null;
            setIsOnlineEth(false);
            if (requestSigner) {
              connectToSigner();
            }
          }
        } else {
          console.error('Metamask provider not detected');
          connectToProvider();
        }
      }, 30000);

      return () => clearInterval(interval);
    }

  }, [provider]);

  return [provider, signer, isOnlineEth, signerAddress, getEventDate];
};

