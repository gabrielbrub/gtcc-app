import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Admin from ".";
import { useEthContext } from "../components/EthContext";
import { useLocalStorage } from "../components/useLocalStorage";
import { authorAbi } from "../ContractsData";
import { AuthorDetails } from "../types";

const AdminWrapper = (): JSX.Element => {
    const { signerAddress, provider } = useEthContext();  
    const { authorAddress } = useParams();
    const [storedValue, setValue] = useLocalStorage<AuthorDetails[]>("@gtcc-author-addresses", []);
    const [isContractOwner, setIsContractOwner] = useState<boolean>(false);
    const navigate = useNavigate();


    const decideNavigation = async () => {
        if (signerAddress && provider) {
            try {
                const authorContract = new ethers.Contract(authorAddress!, authorAbi, provider);
                if (signerAddress === await authorContract.owner()) {
                    setIsContractOwner(true);
                } else {
                    navigate(`/${authorAddress}`, { replace: true });
                }
            } catch (e) {
                console.error(e);
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
    }, [signerAddress, provider]);


    if (isContractOwner) {
        return <Admin />;
    } 
    return <></>;

}

export default AdminWrapper;