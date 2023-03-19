import { create, IPFSHTTPClient, Options } from 'ipfs-http-client';
import { useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';
import { useSessionStorage } from 'usehooks-ts';
import { IPFSConnectionData } from '../types';
import { defaultIpfsHost, defaultIpfsPort, defaultIpfsProtocol } from '../globals';

type IPFSConnection = IPFSHTTPClient | null;

export const useIPFS = (): [IPFSConnection, boolean, (cid: string) => Promise<File>] => {
  const [ipfs, setIPFS] = useState<IPFSConnection>(null);
  const ipfsRef = useRef<IPFSConnection>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [value, setValue] = useSessionStorage<IPFSConnectionData>('@gtcc-ipfs', {
    host: defaultIpfsHost,
    port: defaultIpfsPort,
    protocol: defaultIpfsProtocol,
  });



  const connectIPFS = async () => {
    try {
      let ipfsObj: Options = {
        host: value.host,
        port: value.port,
        protocol: value.protocol,
      }
      if (value.apiSecret && value.projectId) {
        const auth = 'Basic ' + Buffer.from(value.projectId + ':' + value.apiSecret).toString('base64')
        ipfsObj = {
          ...ipfsObj,
          headers: {
            authorization: auth,
          }
        }
      }
      const ipfs = create(ipfsObj);
      console.log('connecting to ipfs');
      setIPFS(ipfs);
      ipfsRef.current = ipfs;
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
        ipfsRef.current.version()
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

    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return [ipfs, isOnline, getFile];
};

export default useIPFS;
