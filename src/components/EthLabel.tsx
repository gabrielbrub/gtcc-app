
interface EthLabelProps {
    signerAddress: string;
}

export const EthLabel = (props: EthLabelProps): JSX.Element => {
    return (
        <>
            {props.signerAddress !== '' ?
                <span className="font-medium text-sm">{`Connected account address: ${props.signerAddress}`}</span>
                :
                <div className="flex flex-row items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                        className="w-4 h-4 text-red-500 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span className="font-medium text-sm">{'Not connected to the blockchain'}</span>
                </div>}
        </>
    );
}