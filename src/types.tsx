
export interface AuthorContract {
    owner: string;
    address: string;
    metadata: string;
}


export interface AuthorDetails {
    contractData: AuthorContract;
    name?: string;
    email?: string;
}

export interface Content {
    mimeType: string;
    licenseType: string;
    contentCid: string;
    metadataCid: string;
    contractData: ContentDetails;
}

export interface ContentDetails {
    content: File;
    contentUrl: string;
    metadata: ContentMetadata;
}

export interface ContentMetadata {
    title: string;
    description: string;
    contentCid: string;
    authorAddress: string;
}