import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/navBar";
import { useEth } from "../components/useEth";
import useIPFS from "../components/useIPFS";
import { useLocalStorage } from "../components/useLocalStorage";
import { authorAbi, authorBytecode } from "../ContractsData";
import { AuthorDetails, Content, ContentMetadata } from "../types";

const Admin = () => {
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const [ipfs, isOnline, getFile] = useIPFS();
    const [provider, signer, isOnlineETh, signerAddress] = useEth();
    const [showNewContentModal, setShowNewContentModal] = useState<boolean>(false);
    const { authorAddress } = useParams();
    const [authorDetails, setAuthorDetails] = useState<AuthorDetails>();
    const [contents, setContents] = useState<Content[]>([]);


    const getMetadataFromIpfs = async (cid: string): Promise<ContentMetadata> => {
        if (ipfs && isOnline) {
            const stream = ipfs.cat(cid);
            let concatenatedChunks = new Uint8Array(0);
            for await (const chunk of stream) {
                const chunkArray = new Uint8Array(chunk);
                const newLength = concatenatedChunks.length + chunkArray.length;
                const newConcatenatedChunks = new Uint8Array(newLength);
                newConcatenatedChunks.set(concatenatedChunks, 0);
                newConcatenatedChunks.set(chunkArray, concatenatedChunks.length);
                concatenatedChunks = newConcatenatedChunks;
            }
            const jsonData: string = new TextDecoder().decode(concatenatedChunks);
            const jsonObject: Record<string, any> = JSON.parse(jsonData);
            return jsonObject as ContentMetadata;
        }
        console.error("Not connected to IPFS");
        throw Error();
    }

    const parseQueryResultsAndUpdateComponentState = async (queryResult: any[]) => {
        const contentBuffer = [];
        for (const event of queryResult) {
            const contentFile = await getFile(event.args.contentCid);
            const contentMetadata = await getMetadataFromIpfs(event.args.metadataCid);
            const content = {
                mimeType: ethers.utils.parseBytes32String(event.args.mimeType),
                licenseType: ethers.utils.parseBytes32String(event.args.mimeType),
                contentCid: event.args.contentCid,
                metadataCid: event.args.metadataCid,
                contractData: {
                    contentUrl: URL.createObjectURL(contentFile),
                    content: contentFile,
                    metadata: contentMetadata,
                },
            }
            contentBuffer.push(content);
        }
        console.log(contentBuffer);
        setContents(contentBuffer);
    }

    const loadContentsFromBlockchain = async () => {
        const authorContract = new ethers.Contract(authorAddress!, authorAbi, signer);
        const filter = authorContract.filters.PublishEventCC(null, null, null, null);
        const query = await authorContract.queryFilter(filter);
        parseQueryResultsAndUpdateComponentState(query);
    }

    async function pinContentToIPFS(file: File): Promise<string> {
        if (!isOnline || ipfs == null) {
            alert("Connection to IPFS has failed.");
            throw Error();
        }
        const fileAdded = await ipfs.add(file);
        console.log("Added file:", fileAdded.path, fileAdded.cid);
        await ipfs.pin.add(fileAdded.cid);
        return fileAdded.path;
    }


    async function pinMetadataToIPFS(object: {}): Promise<string> {
        const metadataFile = new File([JSON.stringify(
            object
        )], "content-metadata.json", { type: 'application/json' });
        return await pinContentToIPFS(metadataFile);
    }


    const publishContent = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);
        const contentCid = await pinContentToIPFS(data.file as File);
        const contentMetadata = {
            'title': data.title,
            'description': data.description,
            'contentCid': contentCid,
            'authorAddress': authorAddress,
        };
        const metadataCid = await pinMetadataToIPFS(contentMetadata);

        if (authorAddress) {
            console.log(signerAddress);
            console.log(signer);
            console.log(authorAddress);
            console.log(ethers.utils.formatBytes32String((data.file as File).type));
            console.log(ethers.utils.formatBytes32String(data.license as string));
            console.log(contentCid);
            console.log(metadataCid);
            const authorContract = new ethers.Contract(authorAddress, authorAbi, signer);
            await authorContract.publishCC(
                ethers.utils.formatBytes32String((data.file as File).type),
                ethers.utils.formatBytes32String(data.license as string),
                contentCid,
                metadataCid,
            );
        }
        loadContentsFromBlockchain();
    };

    const renderContentAccordingToMimeType = (content: Content): JSX.Element => {
        if (content.mimeType.includes('image')) {
            return <img src={content.contractData.contentUrl} className="w-full" />;
        } else if (content.mimeType.includes('video')) {
            return (
                <video className="w-full" controls>
                    <source src={content.contractData.contentUrl} type={content.mimeType} />
                    Your browser does not support the video tag.
                </video>
            );
        }
        return <></>;
    }

    useEffect(() => {
        const author = storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress);
        if (author) {
            setAuthorDetails(storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress));
            loadContentsFromBlockchain();
        } else {
            //Pegar da blockchain
        }
    }, [signerAddress]);

    return (
        <div>
            <Navbar />
            <main className='pt-[80px] max-w-screen-lg mx-auto mb-4'>
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
                {authorDetails && <div className='flex flex-row justify-between mt-4'>
                    <div className='flex flex-col'>
                        <label className='text-sm font-semibold' htmlFor='adress'>Author address</label>
                        <span id='address'>{authorDetails.contractData.address}</span>
                    </div>
                    <div className='flex flex-col min-w-[200px]'>
                        <label className='text-sm font-semibold' htmlFor='details'>Author details</label>
                        <div id='author-details' className='flex flex-col ml-2'>
                            <span className='text-sm font-medium' id='name'>Name: {authorDetails.name}</span>
                            <span className='text-sm font-medium' id='email'>Email: {authorDetails.email}</span>
                        </div>
                    </div>
                </div>}
                <h1 className='font-semibold mt-4 mb-2'>Published contents</h1>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md" onClick={() => {
                    setShowNewContentModal(true);
                }}>
                    Add new
                </button>
                {showNewContentModal && <div className="w-full max-w-md mx-auto">
                    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={async (e:React.FormEvent<HTMLFormElement>) => await publishContent(e)}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="title">
                                Title
                            </label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="title" id="title" type="text" placeholder="Title" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="license">
                                License type
                            </label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="license" id="license" type="text" placeholder="License type" />
                            <a href="https://creativecommons.org/choose/" className="text-sm text-blue-500 hover:text-blue-700">Go to Creative Commons license chooser</a>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="description">
                                Description
                            </label>
                            <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="description" id="description" placeholder="Enter a description"></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="file">
                                File
                            </label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="file" id="file" type="file" />
                        </div>
                        <div className="flex justify-start">
                            <button type="button" className="py-2 mr-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
                                onClick={() => { setShowNewContentModal(false) }}
                            >Cancel</button>
                            <button className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:shadow-outline" type="submit">
                                Deploy
                            </button>
                        </div>
                    </form>
                </div>}
                <hr className='mt-3 mb-3'></hr>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contents.map((content: Content) => {
                        return (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                {renderContentAccordingToMimeType(content)}
                                <div className="p-4">
                                    <h2 className="text-lg font-semibold mb-2">{content.contractData.metadata.title}</h2>
                                    <p className="text-gray-700 mb-2">{content.contractData.metadata.description}</p>
                                    <p className="text-gray-500 text-sm">{content.licenseType}</p>
                                </div>
                            </div>
                        );
                    })}

                </div>
            </main>
        </div>
    );
};

export default Admin;
