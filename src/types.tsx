import { IPFSHTTPClient } from "ipfs-http-client/dist/src/types";

export interface AuthorContract {
    owner: string;
    address: string;
    metadata: string;
}

export interface IPFSContextProvider {
    ipfs: IPFSHTTPClient | null,
    isOnline: boolean,
    getFile: (cid: string) => Promise<File>
  }

export interface IPFSConnectionData {
    host: string;
    port: number;
    projectId?: string;
    apiSecret?: string;
    protocol?: string;
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
    metadata?: ContentMetadata;
}

export interface ContentMetadata {
    title: string;
    description: string;
    contentCid: string;
    authorAddress: string;
}