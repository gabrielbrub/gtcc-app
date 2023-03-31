import { ethers } from "ethers";
import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEthContext } from "../../components/EthContext";
import { useIPFSContext } from "../../components/ipfsContext";
import Navbar from "../../components/navBar";
import { useLocalStorage } from "../../components/useLocalStorage";
import { authorAbi } from "../../ContractsData";
import { AuthorDetails } from "../../types";

const ContractSelection = () => {
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const { ipfs, isOnline } = useIPFSContext();
    const { isOnlineEth, signerAddress, signer } = useEthContext();  
    const [authorDetails, setAuthorDetails] = useState<AuthorDetails[]>([]);
    const [newAuthorAddress, setNewAuthorAddress] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        setAuthorDetails(storedValue.filter((contract: AuthorDetails) => contract.contractData.owner === signerAddress));
    }, [signerAddress]);

    const getMetadataFromIpfs = async (cid: string): Promise<AuthorDetails> => {
        if (ipfs && isOnline) {
            // get the file content
            const stream = ipfs.cat(cid)

            // convert the stream into a string
            let concatenatedChunks = new Uint8Array(0)
            for await (const chunk of stream) {
                const chunkArray = new Uint8Array(chunk)
                const newLength = concatenatedChunks.length + chunkArray.length
                const newConcatenatedChunks = new Uint8Array(newLength)
                newConcatenatedChunks.set(concatenatedChunks, 0)
                newConcatenatedChunks.set(chunkArray, concatenatedChunks.length)
                concatenatedChunks = newConcatenatedChunks
            }
            const jsonData: string = new TextDecoder().decode(concatenatedChunks)

            // parse the JSON string into a TypeScript object
            const jsonObject: Record<string, any> = JSON.parse(jsonData)
            console.log(jsonObject)

            return jsonObject as AuthorDetails;
        }
        console.error("Not connected to IPFS");
        throw Error();
    }

    const handleAdd = async (authorAddress: string): Promise<void> => {
        const asyncFunc = async () => {
            if (isOnline && isOnlineEth) {
                try {
                    const authorContract = new ethers.Contract(authorAddress, authorAbi, signer);
                    const ownerAddress = await authorContract.owner();
                    if (ownerAddress !== signerAddress) {
                        alert("Target author contract owner address doesn't match the connected wallet address. The owner address is: " + ownerAddress
                            + "\nAnd the connected wallet address is: " + signerAddress);
                        return;
                    }
                    const authorMetadataCid = await authorContract.metadata();
                    const metadata = await getMetadataFromIpfs(authorMetadataCid);
    
                    const newAuthorDetails = {
                        contractData: {
                            owner: await authorContract.owner(),
                            address: authorAddress,
                            metadata: authorMetadataCid,
                        },
                        name: metadata.name,
                        email: metadata.email,
                        
                    }
                    setValue([...storedValue, newAuthorDetails]);
                    setAuthorDetails([...authorDetails, newAuthorDetails]);
                } catch(e) {
                    alert("Failed to retrieve author. Please check the address and try again.")
                }
            } else {
                alert("Failed to retrieve author. Please check your connection to IPFS and Metamask and try again.");
            }
        }
        if (storedValue.some((contract: AuthorDetails) => contract.contractData.address === authorAddress)) {
            const owner = storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress);
            alert("Author contract already on list. The owner is: " + owner?.contractData.owner);
            return;
        }
        asyncFunc();
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className='max-w-screen-lg mx-auto flex-grow'>
                <h1 className='font-semibold my-2'>Deployed contracts</h1>
                <form className="flex items-center bg-gray-100 p-4 rounded-md max-w-[50%]" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    handleAdd(newAuthorAddress);
                }}>
                    <input type="text" value={newAuthorAddress}
                        pattern="^0x[a-fA-F0-9]{40}$"
                        title="Enter a valid Ethereum address"
                        required
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAuthorAddress((e.target as HTMLInputElement).value)}
                        className="px-4 py-2 w-full rounded-l-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter existing author address..." />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md">
                        Add
                    </button>
                </form>

                <hr className='mt-3 mb-3'></hr>
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 justify-items-stretch">
                    {authorDetails.map((contract: AuthorDetails) => (
                        <div className="block max-w-md rounded-lg bg-white p-6 shadow-lg mb-3">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium" htmlFor="address">
                                    Author address
                                </label>
                                <span id="address">{contract.contractData.address}</span>
                                <label className="text-sm font-medium" htmlFor="details">
                                    Author details
                                </label>
                                <div id="author-details" className="flex flex-col ml-2">
                                    <span className="text-sm font-medium" id="name">
                                        Name: {contract.name}
                                    </span>
                                    <span className="text-sm font-medium" id="email">
                                        Email: {contract.email}
                                    </span>
                                </div>
                                <button
                                    className="bg-blue-500 mt-4 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
                                    type="button"
                                    onClick={() => {
                                        navigate(`/admin/${contract.contractData.address}`);
                                    }}
                                >
                                    Manage
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            <footer className='w-full text-center py-2'><small>@gTCC 2023</small></footer>
        </div>
    );
};

export default ContractSelection;
