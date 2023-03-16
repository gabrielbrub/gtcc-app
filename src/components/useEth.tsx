import { ethers, Signer } from 'ethers';
import { useEffect, useState } from 'react';

export const useEth = (onConnectedAddressChange?: (newAddress: string) => void): [ethers.providers.Web3Provider |
  undefined, ethers.providers.JsonRpcSigner | undefined, boolean, string] => {

  const [isOnlineEth, setIsOnlineEth] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [signerAddress, setSignerAddress] = useState<string>('');

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

  const connectToSigner = async (providerParam?: ethers.providers.Web3Provider): Promise<Signer | undefined> => {
    console.log("conectando a signer...");

    if (provider || providerParam) {
      const providerPick = providerParam || provider;
      //await provider.send("eth_requestAccounts", []);
      let signerLocal = providerPick!.getSigner();
      const signerAddress = await signerLocal.getAddress();
      console.log("Account: ", signerAddress);
      console.log("conectado a signer");
      setSigner(signerLocal);
      setIsOnlineEth(true);
      return signerLocal;
    } else {
      connectToProvider();
      console.warn("Instalar metamask");
    }
    return undefined;
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (provider) {
      const newSigner = await connectToSigner(provider);
      console.log('Wallet address changed to: ' + accounts[0]);
      const newSignerAddress = await newSigner?.getAddress();
      if (onConnectedAddressChange && newSignerAddress) onConnectedAddressChange(newSignerAddress);
    }
  }

  useEffect(() => {
    const newProvider = connectToProvider();
    connectToSigner(newProvider);
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
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
            connectToSigner();
          })
        } else {
          console.error('Metamask provider not detected');
          connectToProvider();
        }
      }, 10000);

      return () => clearInterval(interval);
    }

  }, [provider]);

  return [provider, signer, isOnlineEth, signerAddress];
};

