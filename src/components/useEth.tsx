import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useSessionStorage } from 'usehooks-ts';

export const useEth = (requestSigner: boolean = true): [ethers.providers.Web3Provider |
  undefined, ethers.providers.JsonRpcSigner | undefined, boolean, string, (event: ethers.Event) => Promise<Date>] => {

  const [isOnlineEth, setIsOnlineEth] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [signerAddress, setSignerAddress] = useSessionStorage<string>("@gtcc-signer-address", '');


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
      console.log("conectando a provider...");
      let providerLocal = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      setProvider(providerLocal);
      console.log("conectado a provider");
      return providerLocal;
    }
  }

  const connectToSigner = async (providerParam?: ethers.providers.Web3Provider): Promise<ethers.providers.JsonRpcSigner | undefined> => {
    console.log('conectando a signer...');
    if (requestSigner) {
      if (provider || providerParam) {
        const providerPick = providerParam || provider;
        await providerPick!.send('eth_requestAccounts', []);
        let signerLocal = providerPick!.getSigner();
        const signerAddress = await signerLocal.getAddress();
        console.log('Account: ', signerAddress);
        console.log('conectado a signer');
        setSigner(signerLocal);
        setIsOnlineEth(true);
        return signerLocal;
      } else {
        connectToProvider();
        console.warn('Instalar metamask');
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
          provider.getNetwork().then(network => {
            console.log(`Connected to network ${network.name}`)
            setIsOnlineEth(true);

          }).catch(error => {
            console.error(`Error getting network: ${error}`)
            setSigner(undefined);
            setIsOnlineEth(false);
            if (requestSigner) {
              connectToSigner();
            }
          })
        } else {
          console.error('Metamask provider not detected');
          connectToProvider();
        }
      }, 10000);

      return () => clearInterval(interval);
    }

  }, [provider]);

  return [provider, signer, isOnlineEth, signerAddress, getEventDate];
};

