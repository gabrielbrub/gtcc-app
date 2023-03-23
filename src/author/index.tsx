import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IpfsButton } from "../components/IpfsButton";
import { useIPFSContext } from "../components/ipfsContext";
import Navbar from "../components/navBar";
import { useEth } from "../components/useEth";
import { useLocalStorage } from "../components/useLocalStorage";
import { authorAbi } from "../ContractsData";
import { defaultIpfsGateway } from "../globals";
import { AuthorDetails, Content, ContentMetadata } from "../types";
import { compareByDate, formatDate, promiseWithTimeout } from "../utils";



const AuthorPage = () => {
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const { ipfs, isOnline, getFile } = useIPFSContext();
    const [provider, signer, isOnlineETh, signerAddress, getEventDate] = useEth(false);
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
        throw Error(`Error fetching ${cid} from IPFS`);
    }

    const parseQueryResultsAndUpdateComponentState = async (queryResult: any[]) => {
        for (const event of queryResult) {
            getFile(event.args.contentCid).then(async (contentFile: File) => {
                let contentMetadata;
                try {
                    contentMetadata = await promiseWithTimeout(getMetadataFromIpfs(event.args.metadataCid), 15000);
                } catch (e) {
                    console.error(e);
                }
                const content = {
                    mimeType: ethers.utils.parseBytes32String(event.args.mimeType),
                    licenseType: ethers.utils.parseBytes32String(event.args.licenseType),
                    contentCid: event.args.contentCid,
                    metadataCid: event.args.metadataCid,
                    date: formatDate(await getEventDate(event)),
                    contractData: {
                        contentUrl: URL.createObjectURL(contentFile),
                        content: contentFile,
                        metadata: contentMetadata,
                    },
                }
                setContents(prev => [content, ...prev]);
            });
        }
    }


    const loadContentsFromBlockchain = async () => {
        const authorContract = new ethers.Contract(authorAddress!, authorAbi, provider);
        const filter = authorContract.filters.PublishEventCC(null, null, null, null);
        const query = await authorContract.queryFilter(filter);
        parseQueryResultsAndUpdateComponentState(query);
    }

    useEffect(() => {
        const author = storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress);
        if (author && provider && isOnline) {
            setAuthorDetails(storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress));
            loadContentsFromBlockchain();
        }
    }, [provider, isOnline]);

    const renderContentAccordingToMimeType = (content: Content): JSX.Element => {
        if (content.mimeType.includes('image')) {
            return <img src={content.contractData.contentUrl} className='w-full h-[300px] max-w-full' />;
        } else if (content.mimeType.includes('video')) {
            return (
                <video className='w-full h-full max-w-full object-cover object-center' controls>
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
            <main className='max-w-screen-lg mx-auto mb-4'>
                <IpfsButton />
                {authorDetails && <div className='flex flex-row justify-between mt-4'>
                    <div className='flex flex-col'>
                        <label className='text-sm font-semibold' htmlFor='adress'>Author address</label>
                        <span id='address'>{authorDetails.contractData.address}</span>
                    </div>
                    {(authorDetails.name || authorDetails.email) &&
                        <div className='flex flex-col min-w-[200px]'>
                            <label className='text-sm font-semibold' htmlFor='details'>Author details</label>
                            <div id='author-details' className='flex flex-col'>
                                {authorDetails.name && <span className='text-sm font-medium' id='name'>Name: {authorDetails.name}</span>}
                                {authorDetails.email && <span className='text-sm font-medium' id='email'>Email: {authorDetails.email}</span>}
                            </div>
                        </div>
                    }
                </div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {contents.sort(compareByDate).map((content: Content) => {
                        return (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onClick={() => {
                                const url = defaultIpfsGateway + content.contentCid;
                                window.open(url);
                            }}>
                                <div className="w-full h-[300px] overflow-hidden">
                                    {renderContentAccordingToMimeType(content)}
                                </div>
                                <div className="p-4">
                                    {content.contractData.metadata && <h2 className="text-lg font-semibold mb-2">{content.contractData.metadata.title}</h2>}
                                    {content.contractData.metadata && <p className="text-gray-700 mb-2">{content.contractData.metadata.description}</p>}
                                    {content.licenseType && <p className="text-gray-500 text-sm mb-2">{'License: ' + content.licenseType}</p>}
                                    <p className="text-gray-500 text-sm">{content.date}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}

export default AuthorPage;