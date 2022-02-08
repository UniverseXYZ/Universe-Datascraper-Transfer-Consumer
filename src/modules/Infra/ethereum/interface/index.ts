export enum EthereumNetworkType {
  mainnet = 'mainnet',
  rinkeby = 'rinkeby',
  aws = 'aws',
  ropsten = 'ropsten',
}

export type NetworkType = keyof typeof EthereumNetworkType;

// Infura error
// { code: -32005, message: 'query returned more than 10000 results' }

// Alchemy
// {
//   code: -32602,
//   message: 'Log response size exceeded. You can make eth_getLogs requests with up to a 2K block range and no limit on the response size, or you can request any block range with a cap of 10K logs in the response. Based on your parameters and the response size limit, this block range should work: [0xc5dc00, 0xc614a7]'
// }
export interface TransferHistoryError {
  code: number;
  message: string;
}

export interface ERC1155Owner {
  ownerAddress: string;
  value: string;
}

export interface Token {
  blockNumber: number;
  firstOwner?: string;
  latestOwner?: string;
  contractAddress: string;
  fromAddress: any;
  toAddress: any;
  tokenId: string; // for ERC1155, using string as the value length can be very long
  tokenType: string;
  value?: number;
  // as ERC1155 is multi token,
  // use txn hash to identify the token is unique for each owner
  // even the owner can have multiple token tokens
  // multi token owners will appear in the multi times in owners field of NFT Tokens
  transactionHash?: string;
}

export interface TransferHistory {
  blockNum: number;
  contractAddress: string;
  from: string;
  to: string;
  hash: string;
  value?: string;
  erc721TokenId?: string;
  erc1155Metadata?: any;
  asset?: string;
  category: string;
}

export interface TokenFetcher {
  getTokensAndTransferHistory: (
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ) => Promise<{
    tokens: Token[];
    transferHistory: TransferHistory[];
  }>;
}
