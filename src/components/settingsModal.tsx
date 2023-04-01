import { create } from 'ipfs-http-client';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useSessionStorage } from 'usehooks-ts';
import { defaultIpfsHost, defaultIpfsPort, defaultIpfsProtocol } from '../globals';
import { IPFSConnectionData } from '../types';
import { Buffer } from 'buffer';
import { promiseWithTimeout } from '../utils';
import { useNavigate } from 'react-router-dom';

interface SettingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onRequestClose }) => {
  const [value, setValue] = useSessionStorage<IPFSConnectionData>('@gtcc-ipfs', {
    host: defaultIpfsHost,
    port: defaultIpfsPort,
    protocol: defaultIpfsProtocol,
  });
  const [useLocalNode, setUseLocalNode] = useState(true);
  const [host, setHost] = useState(value.host);
  const [port, setPort] = useState(value.port);
  const [protocol, setProtocol] = useState(value.protocol);
  const [projectId, setProjectId] = useState<string>();
  const [apiSecret, setApiSecret] = useState<string>();
  const navigate = useNavigate();



  useEffect(() => {
    setHost(value.host);
    setPort(value.port);
    setProtocol(value.protocol);
    setProjectId(value.projectId);
    setApiSecret(value.apiSecret);
  }, [value, isOpen]);

  const handleConfirm = async () => {
    setValue({
      host: host,
      port: port,
      protocol: protocol,
      projectId: projectId,
      apiSecret: apiSecret,
    });
    navigate(0);
  };

  const handleCancel = () => {
    onRequestClose();
  };

  const handleDefault = () => {
    setHost(defaultIpfsHost);
    setPort(defaultIpfsPort);
    setProtocol(defaultIpfsProtocol);
    setProjectId(undefined);
    setApiSecret(undefined);
    setUseLocalNode(true);
  };

  const handleTestConnection = async () => {
    try {
      let testIpfs;
      if (useLocalNode) {
        testIpfs = create({
          host: host,
          protocol: protocol,
          port: port,
        })
      } else {
        const auth = 'Basic ' + Buffer.from(projectId + ':' + apiSecret).toString('base64');
        testIpfs = create({
          host: host,
          protocol: protocol,
          port: port,
          headers: {
            authorization: auth,
          }
        })
      }
      await promiseWithTimeout(testIpfs.version(), 10000);
      alert("Attempt to connect to IPFS succeeded.");
    } catch (e) {
      alert("Attempt to connect to IPFS failed.");
      throw e;
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      className="fixed inset-0 flex items-center justify-center z-20 p-4 bg-black bg-opacity-50"
      overlayClassName="fixed inset-0"
    >
      <div className="w-full max-w-md bg-white rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Settings</h3>
        <label className="block mb-2">
          Host:
          <input className="w-full mt-1 border p-2 rounded" value={host} onChange={(e) => setHost(e.target.value)} />
        </label>
        <label className="block mb-2">
          Port:
          <input type="number" className="w-full mt-1 border p-2 rounded" value={port} onChange={(e) => setPort(Number(e.target.value))} />
        </label>

        <label className="block mb-2">
          Protocol:
          <input className="w-full mt-1 border p-2 rounded" value={protocol} onChange={(e) => setProtocol(e.target.value)} />
        </label>

        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={useLocalNode}
            onChange={() => setUseLocalNode(!useLocalNode)}
            className="mr-2"
          />
          Use local node
        </label>
        {!useLocalNode && (
          <>
            <label className="block mb-2">
              Project ID:
              <input className="w-full mt-1 border p-2 rounded" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            </label>
            <label className="block mb-4">
              API Secret:
              <input className="w-full mt-1 border p-2 rounded" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} />
            </label>
          </>
        )}
        <div className="flex flex-col items-end">
          <span className='pr-2 font-semibold text-sm text-blue-600 cursor-pointer mb-1'
            onClick={handleTestConnection}
          >Test connection</span>
          <div className="flex justify-end space-x-2">
            <button onClick={handleDefault} className="bg-gray-500 text-white px-4 py-2 rounded">
              Reset Defaults
            </button>
            <button onClick={handleCancel} className="bg-red-400 text-white px-4 py-2 rounded">
              Cancel
            </button>
            <button onClick={handleConfirm} className="bg-blue-500 text-white px-4 py-2 rounded">
              Confirm
            </button>
            <div />
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
