import { ethers } from "ethers";
import { useContext, useState } from 'react';
import Navbar from "../components/navBar";
import { authorAbi, authorBytecode } from '../ContractsData'
import { useLocalStorage } from "../components/useLocalStorage";
import { AuthorDetails } from "../types";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useNavigate } from "react-router-dom";
import { IpfsButton } from "../components/IpfsButton";
import { IPFSContext } from "../components/ipfsContext";
import { EthLabel } from "../components/EthLabel";
import { useEthContext } from "../components/EthContext";

const Deploy = () => {
  const { ipfs, isOnline } = useContext(IPFSContext);
  const { signerAddress, signer, isOnlineEth } = useEthContext();
  const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  const deployAuthorContract = async (cid: string): Promise<string> => {
    let factory = new ethers.ContractFactory(
      authorAbi,
      authorBytecode,
      signer,
    );

    let contract = await factory.deploy(cid);
    console.log(Date.now());
    await contract.deployed();
    console.log(Date.now());
    console.log('Deployed contract address: ' + contract.address);
    console.log('Deploy transaction hash: ' + contract.deployTransaction.hash);
    return contract.address;
  };


  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isOnline && isOnlineEth) {
      setLoading(true);
      try {
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);
        const cid = await pinContentToIPFS(data.name as string, data.email as string);
        const address = await deployAuthorContract(cid);
        setLoading(false);
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
          name: data.name as string,
          email: data.email as string,
        };
        setValue([...storedValue, contractDetails]);
      } catch (e) {
        alert(`Error while deploying author: ${e}`);
      }
    } else {
      alert("Error. Please check your connection to IPFS and Ethereum.")
    }
    setLoading(false);
  }

  async function pinContentToIPFS(name: string, email: string): Promise<string> {
    if (!isOnline || ipfs == null) {
      alert("Connection to IPFS has failed.");
      throw Error();
    }

    const metadataFile = new File([JSON.stringify(
      {
        "version": "0.1.0",
        "name": name,
        "email": email,
      }
    )], "author-metadata.json", { type: 'application/json' });


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
          <IpfsButton />
          <EthLabel signerAddress={signerAddress} />
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
              <form onSubmit={(e) => {
                e.preventDefault();
                submitForm(e);
              }} className="overflow-hidden shadow sm:rounded-md">
                <div className="bg-white px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        required
                        type="text" name="name" id="name" autoComplete="given-name"
                        className="mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight 
                          focus:outline-none"></input>
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" required name="email" id="address" autoComplete="email"
                        className="mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight 
                        focus:outline-none"></input>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                  <button type="submit" className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 disabled:opacity-75
                         px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                         ${loading ? 'opacity-50 cursor-wait' : ''}`}
                    disabled={loading}>  {loading ? 'Loading...' : 'Publish'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <footer className='absolute bottom-0 w-full text-center py-2'><small>@gTCC 2023</small></footer>
    </div>
  );
};

export default Deploy;
