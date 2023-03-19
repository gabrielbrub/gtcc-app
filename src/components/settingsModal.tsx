import React, { useState } from 'react';
import Modal from 'react-modal';
import { useSessionStorage } from 'usehooks-ts';
import { defaultIpfsHost, defaultIpfsPort, defaultIpfsProtocol } from '../globals';
import { IPFSConnectionData } from '../types';

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

  const handleConfirm = () => {
    setValue({
      host: host,
      port: port,
      protocol: useLocalNode ? 'http' : 'https',
      projectId: projectId,
      apiSecret: apiSecret,
    });
    onRequestClose();
  };

  const handleCancel = () => {
    onRequestClose();
  };

  const handleDefault = () => {
    setHost(defaultIpfsHost);
    setPort(defaultIpfsPort);
    setProtocol(defaultIpfsProtocol);
    setUseLocalNode(true);
  };

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
    </Modal>
  );
};

export default SettingsModal;
