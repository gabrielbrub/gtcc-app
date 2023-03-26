import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Admin from ".";
import { useIPFSContext } from "../components/ipfsContext";
import { useEth } from "../components/useEth";
import { useLocalStorage } from "../components/useLocalStorage";
import { authorAbi } from "../ContractsData";
import { AuthorDetails } from "../types";

const AdminWrapper = (): JSX.Element => {
    const [provider, signer, isOnlineETh, signerAddress] = useEth(false);
    const { authorAddress } = useParams();
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const [isContractOwner, setIsContractOwner] = useState<boolean | undefined>(undefined);
    const { isOnline } = useIPFSContext();
    const navigate = useNavigate();


    const decideNavigation = async () => {
        if (isOnline && isOnlineETh) {
            try {
                const authorContract = new ethers.Contract(authorAddress!, authorAbi, provider);
                if (signerAddress === await authorContract.owner()) {
                    setIsContractOwner(true);
                } else {
                    navigate(`/${authorAddress}`, { replace: true });
                }
            } catch (e) {
                alert("Something went wrong when loading Author information. Please check your connection to Metamask.");
            }
        }
    }

    useEffect(() => {
        const author = storedValue.find((contract: AuthorDetails) => contract.contractData.address === signerAddress);
        if (author) {
            setIsContractOwner(true);
        } else {
            decideNavigation();
        }
    }, [isOnline, isOnlineETh]);


    if (isContractOwner) {
        return <Admin />;
    } 
    return <>Loading...</>;

}

export default AdminWrapper;