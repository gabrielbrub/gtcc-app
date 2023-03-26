import { ethers } from "ethers";
import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";
import { IpfsButton } from "../components/IpfsButton";
import { useIPFSContext } from "../components/ipfsContext";
import Navbar from "../components/navBar";
import { useEth } from "../components/useEth";
import { authorAbi } from "../ContractsData";
import { AuthorDetails } from "../types";


export const Home = (): JSX.Element => {
    const [authorDetails, setAuthorDetails] = useState<AuthorDetails[]>([]);
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const [provider, signer, isOnlineETh, signerAddress] = useEth();
    const navigate = useNavigate();
    const { ipfs, isOnline } = useIPFSContext();
    const [newAuthorAddress, setNewAuthorAddress] = useState<string>('');


    const getMetadataFromIpfs = async (cid: string): Promise<AuthorDetails> => {
        if (ipfs && isOnline) {
            const stream = ipfs.cat(cid)

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
            const jsonObject: Record<string, any> = JSON.parse(jsonData)
            return jsonObject as AuthorDetails;
        }
        throw Error("Not connected to IPFS");
    }

    const handleAdd = async (authorAddress: string): Promise<void> => {
        const asyncFunc = async () => {
            if (isOnline && provider) {
                try {
                    const authorContract = new ethers.Contract(authorAddress, authorAbi, provider);
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

    return <div>
        <Navbar />
        <main className='max-w-screen-lg mx-auto'>

            <div className='flex flex-row mt-1 justify-between'>
                <IpfsButton />
            </div>
            <h1 className='font-semibold mt-4 mb-2'>Authors stored in your browser</h1>
            <form className="flex items-center bg-gray-100 p-4 rounded-md max-w-[50%]" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                handleAdd(newAuthorAddress);
            }}>
                <input type="text" 
                    pattern="^0x[a-fA-F0-9]{40}$"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAuthorAddress((e.target as HTMLInputElement).value)}
                    title="Enter a valid Ethereum address"
                    required
                    className="px-4 py-2 w-full rounded-l-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter existing author address..." />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md">
                    Add
                </button>
            </form>
            <hr className='mt-3 mb-3'></hr>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 justify-items-stretch">
                {storedValue.map((contract: AuthorDetails) => (
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
                                    navigate(`/${contract.contractData.address}`);
                                }}
                            >
                                Go to author's page
                            </button>
                        </div>
                    </div>
                ))}

            </div>

        </main>

    </div>;
}