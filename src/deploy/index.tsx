import { ethers, Signer } from "ethers";
import { ChangeEvent, useEffect, useState } from 'react';
import Navbar from "../components/navBar";
import { authorAbi, authorBytecode } from '../ContractsData'
import { useIPFS } from "../components/useIPFS";
import { useEth } from "../components/useEth";
import { useLocalStorage } from "../components/useLocalStorage";
import { AuthorDetails } from "../types";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useNavigate } from "react-router-dom";

const Deploy = () => {
  //const [provider, setProvider] = useState<ethers.providers.Web3Provider | undefined>();
  const [metadata, setMetadata] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [ipfs, isOnline] = useIPFS();
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

    // The contract is NOT deployed yet; we must wait until it is mined
    await contract.deployed();

    return contract.address;

    /*       if (provider)
            getTransactionsByType(provider, await signer?.getAddress() || '', contentHubBytecode.object) */
  };


  const submitForm = async () => {
    console.log(name);
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
    console.log(newObj);
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
      <main className='pt-[80px] max-w-screen-lg mx-auto'>
        <div className='flex flex-row mt-1 justify-between'>
          <div className='flex flex-row mt-1 items-center'>
            <span className='pl-[4px]'>IPFS</span>
            {isOnline ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pl-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pl-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>}
          </div>
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
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                          value={name}
                          type="text" name="first-name" id="first-name" autoComplete="given-name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></input>
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="text" name="email-address" id="email-address" autoComplete="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></input>
                      </div>

                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 disabled:opacity-75
                         px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                         disabled={signerAddress===''}
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
