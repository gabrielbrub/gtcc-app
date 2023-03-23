import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Admin from ".";
import { useIPFSContext } from "../components/ipfsContext";
import { useEth } from "../components/useEth";
import { useLocalStorage } from "../components/useLocalStorage";
import { authorAbi } from "../ContractsData";
import AuthorPage from "../author";
import { AuthorDetails } from "../types";

enum Destination {
    ADMIN, USER
}

const AdminWrapper = (): JSX.Element => {
    const [provider, signer, isOnlineETh, signerAddress] = useEth(false);
    const { authorAddress } = useParams();
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const [destination, setDestination] = useState<Destination | undefined>(undefined);
    const { ipfs, isOnline } = useIPFSContext();

    const loadFromEthereumAndIPFS = async () => {
        const authorContract = new ethers.Contract(authorAddress!, authorAbi, provider);
        const authorMetadataCid = await authorContract.metadata();
        const newObj = {
            owner: await authorContract.owner(),
            address: authorContract.address,
            metadata: await authorContract.metadata(),
        };

        let contractDetails: AuthorDetails = {
            contractData: newObj,
        };

        try {
            const authorMetadata = await getMetadataFromIpfs(authorMetadataCid);
            contractDetails = {
                contractData: newObj,
                name: authorMetadata.name,
                email: authorMetadata.email,
            }
        } catch (error) {
            console.log("Error when loading file from IPFS");
        }
        setValue([...storedValue, contractDetails]);
    }

    const decideNavigation = async () => {
        if (isOnline && isOnlineETh) {
            loadFromEthereumAndIPFS()
                .then(() => {
                    if (authorAddress === signerAddress) {
                        setDestination(Destination.ADMIN);
                    } else {
                        setDestination(Destination.USER);
                    }
                }).catch((error) => {
                    console.error(error);
                    alert("Something went wrong when loading Author information. Please check the target author address and your connection to IPFS and Metamask.");
                });
        }
    }

    useEffect(() => {
        const author = storedValue.find((contract: AuthorDetails) => contract.contractData.address === authorAddress);
        if (author) {
            setDestination(Destination.ADMIN);
        } else {
            decideNavigation();
        }
    }, [isOnline, isOnlineETh]);

    const getMetadataFromIpfs = async (cid: string): Promise<{ name: string; email: string }> => {
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
            return jsonObject as { name: string; email: string };
        }
        console.error("Not connected to IPFS");
        throw Error();
    }


    if (destination === Destination.ADMIN) {
        return <Admin />;
    } else if (destination === Destination.USER) {
        return <AuthorPage />
    }
    return <>Loading...</>;

}

export default AdminWrapper;