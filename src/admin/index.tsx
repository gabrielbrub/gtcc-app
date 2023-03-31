import { ethers } from "ethers";
import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useEthContext } from "../components/EthContext";
import { EthLabel } from "../components/EthLabel";
import { IpfsButton } from "../components/IpfsButton";
import { IPFSContext } from "../components/ipfsContext";
import Navbar from "../components/navBar";
import { useLocalStorage } from "../components/useLocalStorage";
import { authorAbi } from "../ContractsData";
import { defaultIpfsGateway } from "../globals";
import { AuthorDetails, Content, ContentMetadata } from "../types";
import { compareByDate, formatDate, promiseWithTimeout } from "../utils";
import * as piexif from 'piexifjs';
import { Buffer } from 'buffer';

const Admin = () => {
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const { ipfs, isOnline, getFile } = useContext(IPFSContext);
    const { signerAddress, signer, isOnlineEth, getEventDate } = useEthContext();
    const [showNewContentModal, setShowNewContentModal] = useState<boolean>(false);
    const { authorAddress } = useParams();
    const [authorDetails, setAuthorDetails] = useState<AuthorDetails>();
    const [contents, setContents] = useState<Content[]>([]);
    const MySwal = withReactContent(Swal);
    const [loading, setLoading] = useState(false);

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
        const authorContract = new ethers.Contract(authorAddress!, authorAbi, signer);
        const filter = authorContract.filters.PublishEvent(null, null, null, null);
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

    function readFileAsDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (event) {
                resolve(event.target?.result as string);
            };
            reader.onerror = function (error) {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }


    function dataURLtoBlob(dataUrl: string): Blob {
        const binary = atob(dataUrl.split(',')[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        return new Blob([array], { type: 'image/jpeg' });
    }

    const publishContent = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (isOnline && isOnlineEth) {
            setLoading(true);
            try {
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData);

                let fileToPin = data.file as File;
                if (fileToPin.type === "image/jpeg") {
                    const dataUrl = await readFileAsDataURL(data.file as File);
                    const jpegData = piexif.load(dataUrl);


                    jpegData["0th"][piexif.ImageIFD.XPComment] = [...Buffer.from(data.description as string, 'ucs2')];
                    jpegData["0th"][piexif.ImageIFD.Copyright] = data.license as string;
                    jpegData["0th"][piexif.ImageIFD.XPTitle] = [...Buffer.from(data.title as string, 'ucs2')];
                    jpegData["0th"][piexif.ImageIFD.Artist] = authorDetails?.name;

                    const newDataUrl = piexif.insert(piexif.dump(jpegData), dataUrl);
                    const modifiedImageBlob = dataURLtoBlob(newDataUrl);
                    fileToPin = new File([modifiedImageBlob], modifiedImageBlob.name, { type: "image/jpeg" });
                }
                const contentCid = await pinContentToIPFS(fileToPin);

                const contentMetadata = {
                    'title': data.title,
                    'description': data.description,
                    'contentCid': contentCid,
                    'authorAddress': authorAddress,
                };
                const metadataCid = await pinMetadataToIPFS(contentMetadata);

                if (authorAddress) {
                    const authorContract = new ethers.Contract(authorAddress, authorAbi, signer);
                    await authorContract.publish(
                        ethers.utils.formatBytes32String((data.file as File).type),
                        ethers.utils.formatBytes32String(data.license as string),
                        contentCid,
                        metadataCid,
                    );
                    const eventListener = async (eventArgs: any) => {
                        setShowNewContentModal(false);
                        setLoading(false);
                        console.log('Event received:', eventArgs);
                        MySwal.fire({
                            icon: 'success',
                            showConfirmButton: false,
                            timer: 3000,
                            title: "Content published",
                            text: " Reload the page shortly and" +
                                " you should be able to see it."
                        });
                        authorContract.off("PublishEvent", eventListener);
                    };
                    authorContract.on("PublishEvent", eventListener);
                }
            } catch (e) {
                console.error(e);
                alert("Something went wrong");
                setShowNewContentModal(false);
                setLoading(false);
            }
        } else {
            alert("Error. Please check your connection to IPFS and Ethereum.")
        }
    };

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

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const handleFileInputChange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
                if (file.type !== 'image/jpeg') {
                    alert("This application does not support adding metadata to the provided file type."
                        + " If you don't want to rely on the IPFS-stored metadata, make sure to set the appropriate file metadata before publishing it.");
                }
            }
        };

        const fileInput = fileInputRef.current;
        if (fileInput) {
            fileInput.addEventListener('change', handleFileInputChange);
        }

        return () => {
            if (fileInput) {
                fileInput.removeEventListener('change', handleFileInputChange);
            }
        };
    }, [showNewContentModal]);

    useEffect(() => {
        const author = storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress);
        if (author && isOnline && signerAddress) {
            setAuthorDetails(storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress));
            loadContentsFromBlockchain();
        }
    }, [signerAddress, isOnline]);

    return (
        <div>
            <Navbar />
            <main className='max-w-screen-lg mx-auto mb-4'>
                <div className='flex flex-row mt-1 justify-between'>
                    <IpfsButton />
                    <EthLabel signerAddress={signerAddress} />
                </div>
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
                <h1 className='font-semibold mt-4 mb-2'>Published contents</h1>
                <button className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md' onClick={() => {
                    setShowNewContentModal(true);
                }}>
                    Add
                </button>
                {showNewContentModal && <div className="w-full max-w-md mx-auto">
                    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={async (e: React.FormEvent<HTMLFormElement>) => await publishContent(e)}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="title">
                                Title
                            </label>
                            <input required maxLength={30} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="title" id="title" type="text" placeholder="Title" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="license">
                                License type
                            </label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="license" required id="license" type="text" placeholder="License type" />
                            <a href="https://creativecommons.org/choose/" target="_blank"
                                className="text-sm text-blue-500 hover:text-blue-700">Go to Creative Commons license chooser</a>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="description">
                                Description
                            </label>
                            <textarea maxLength={300} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="description" id="description" placeholder="Enter a description"></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="file">
                                File
                            </label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required name="file" id="file" type="file" accept="image/*,video/*" ref={fileInputRef} />
                        </div>
                        <div className="flex justify-end">
                            <button type="button" className="py-2 mr-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
                                onClick={() => { setShowNewContentModal(false) }}
                            >Cancel</button>
                            <button
                                className={`bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-wait' : ''
                                    }`}
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Publish'}
                            </button>
                        </div>
                    </form>
                </div>}
                <hr className='mt-3 mb-3'></hr>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contents.sort(compareByDate).map((content: Content) => {
                        return (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                                key={content.contentCid}
                                onClick={() => {
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
            <footer className='absolute bottom-0 w-full text-center'><small>@gTCC 2023</small></footer>
        </div>
    );
};

export default Admin;