import { ethers } from "ethers";
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import Navbar from "../components/navBar";
import { authorAbi, authorBytecode } from '../ContractsData'
import { useEth } from "../components/useEth";
import { useLocalStorage } from "../components/useLocalStorage";
import { AuthorDetails } from "../types";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useNavigate } from "react-router-dom";
import { IpfsButton } from "../components/ipfsButton";
import { IPFSContext } from "../components/ipfsContext";

const Deploy = () => {
  const [metadata, setMetadata] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const { ipfs, isOnline, getFile } = useContext(IPFSContext);  
  const [provider, signer, isOnlineETh, signerAddress] = useEth();
  const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();


  const deployAuthorContract = async (cid: string): Promise<string> => {
    let factory = new ethers.ContractFactory(
      authorAbi,
      authorBytecode,
      signer,
    );

    let contract = await factory.deploy(cid);

    console.log(contract.address);

    console.log(contract.deployTransaction.hash);

    await contract.deployed();

    return contract.address;
  };


  const submitForm = async () => {
    const cid = await pinContentToIPFS();
    const address = await deployAuthorContract(cid);

    MySwal.fire({
      title: <p>Contract Deployed</p>,
      html: <span>The author contract was deployed and can be accessed by its address: <b>{address}</b> <br />
        The associated metadata file has the following CID: <br /><b>{cid}</b></span>,
      willClose: () => {
        if (storedValue.filter((contract: AuthorDetails) => contract.contractData.owner === signerAddress).length > 1) {
          navigate('/admin');
        } else {
          navigate('/admin/' + address);
        }
      }
    });
    const newObj = {
      owner: signerAddress,
      address: address,
      metadata: cid,
    };
    const contractDetails = {
      contractData: newObj,
      name: name,
      email: email,
    };
    setValue([...storedValue, contractDetails]);
  }

  async function pinContentToIPFS(): Promise<string> {
    if (!isOnline || ipfs == null) {
      alert("Connection to IPFS has failed.");
      throw Error();
    }

    const metadataFile = new File([JSON.stringify(
      {
        "version": "0.0.1",
        "name": name,
        "email": email,
      }
    )], "marco-zero.json", { type: 'application/json' });


    const fileAdded = await ipfs.add(metadataFile);
    console.log("Added file:", fileAdded.path, fileAdded.cid);
    await ipfs.pin.add(fileAdded.cid);
    return fileAdded.path;

  }

  return (
    <div>
      <Navbar />
      <main className='max-w-screen-lg mx-auto'>
        <div className='flex flex-row mt-1 justify-between'>
          <IpfsButton/>
          <span>{`Connected wallet address: ${signerAddress}`}</span>
        </div>
        <div className="mt-5">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Deploy your Author contract</h3>
                <p className="mt-1 text-sm text-gray-600">Don't forget to write down your deployed  contract address and CID.</p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <form action="#" method="POST">
                <div className="overflow-hidden shadow sm:rounded-md">
                  <div className="bg-white px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-6 gap-6">

                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          required
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                          value={name}
                          type="text" name="first-name" id="first-name" autoComplete="given-name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></input>
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" required name="email-address" id="email-address" autoComplete="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></input>
                      </div>

                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 disabled:opacity-75
                         px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      disabled={signerAddress === ''}
                      onClick={(e) => {
                        e.preventDefault();
                        submitForm();
                      }}
                    >Deploy</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <footer className='absolute bottom-0 w-full text-center'><small>@ gTCC 2023</small></footer>
    </div>
  );
};

export default Deploy;
