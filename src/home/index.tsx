import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/navBar";
import { useEth } from "../components/useEth";
import useIPFS from "../components/useIPFS";
import { useLocalStorage } from "../components/useLocalStorage";
import { authorAbi } from "../ContractsData";
import { AuthorDetails, Content, ContentMetadata } from "../types";



const Home = () => {
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const [ipfs, isOnline, getFile] = useIPFS();
    const [provider, signer, isOnlineETh, signerAddress] = useEth();
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

    useEffect(() => {
        const author = storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress);
        if (author) {
            setAuthorDetails(storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress));
            loadContentsFromBlockchain();
        } else {
            //Pegar da blockchain
        }
    }, [signerAddress]);

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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
}

export default Home;