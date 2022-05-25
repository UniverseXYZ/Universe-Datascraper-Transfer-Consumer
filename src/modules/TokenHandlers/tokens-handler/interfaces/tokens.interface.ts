import { CreateNFTTokenDto } from 'src/modules/Dal/dal-nft-token/dto/create-nft-token.dto';
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
  blockNumber?: number;
  firstOwner?: string;
  contractAddress: string;
  fromAddress?: any;
  toAddress?: any;
  tokenId: string;
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
  logIndex: number;
  tokenId: string;
  value?: number;
  erc721TokenId?: string;
  erc1155Metadata?: any;
  cryptopunks?: any;
  asset?: string;
  category: string;
}

export interface Handler {
  handle(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
    batchSize: number
  ): Promise<void>;
}

export interface Analyser {
  handleUpcomingTokens(tokens: CreateNFTTokenDto[], batchSize: number): Promise<void>;
}

export interface TokenTransferFetcher {
  getTokensAndTransferHistory: (
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ) => Promise<{
    tokens: Token[];
    transferHistory: TransferHistory[];
  }>;
}

export interface LatestOwner {
  ownerAddress: string;
  contractAddress: string;
  hash: string;
  blockNumber: number;
  tokenId: string;
}

export interface TokenWithLatestOwnerTransferFetcher {
  getTokensWithLatestOwnersAndTransferHistory: (
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ) => Promise<{
    tokens: Token[];
    latestOwners: LatestOwner[];
    transferHistory: TransferHistory[];
  }>;
}

export class SizeExceedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SizeExceedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BulkWriteError extends Error {
  constructor(message: string, stack: string) {
    super(message);
    this.name = 'BulkWriteError';
    this.stack = stack;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
