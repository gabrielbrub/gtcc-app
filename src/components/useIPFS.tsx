import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { useEffect, useRef, useState } from 'react';

type IPFSConnection = IPFSHTTPClient | null;

export const useIPFS = (): [IPFSConnection, boolean, (cid: string) => Promise<File>] => {
  const [ipfs, setIPFS] = useState<IPFSConnection>(null);
  const ipfsRef = useRef<IPFSConnection>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  const connectIPFS = async () => {
    try {
      console.log('connecting to ipfs');
      const ipfs = create({ host: '127.0.0.1', port: 5001, protocol: 'http' });
      setIPFS(ipfs);
      ipfsRef.current = ipfs;
      ipfs.isOnline();
      setIsOnline(true);
    } catch (error) {
      console.error('Failed to connect to IPFS node:', error);
      setIPFS(null);
      ipfsRef.current = null;
      setIsOnline(false);
    }
  };

  async function getFile(cid: string): Promise<File> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of ipfsRef.current!.cat(cid)) {
      chunks.push(chunk);
    }
    const fileData = new Blob(chunks);
    const file = new File([fileData], cid.toString());
    return file;
  }

  useEffect(() => {
    connectIPFS();

    const interval = setInterval(() => {
      if (ipfsRef.current != null) {
        Promise.resolve(ipfsRef.current.isOnline())
          .then(() => {
            console.log('is online then');
            setIsOnline(true);
          })
          .catch(() => {
            console.warn('Lost connection to IPFS node, attempting to reconnect...');
            setIPFS(null);
            ipfsRef.current = null;
            setIsOnline(false);
            connectIPFS();
          });
      } else {
        connectIPFS();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return [ipfs, isOnline, getFile];
};

export default useIPFS;
