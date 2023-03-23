import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";
import { EthLabel } from "../components/EthLabel";
import { IpfsButton } from "../components/IpfsButton";
import Navbar from "../components/navBar";
import { AuthorDetails } from "../types";


export const Home = (): JSX.Element => {
    const [authorDetails, setAuthorDetails] = useState<AuthorDetails[]>([]);
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const navigate = useNavigate();


    return <div>
        <Navbar />
        <main className='max-w-screen-lg mx-auto'>

            <div className='flex flex-row mt-1 justify-between'>
                <IpfsButton />
            </div>
            <h1 className='font-semibold mt-4 mb-2'>Authors stored in your browser</h1>
            <form className="flex items-center bg-gray-100 p-4 rounded-md max-w-[50%]" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
            }}>
                <input type="text" 
                    pattern="^0x[a-fA-F0-9]{40}$"
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