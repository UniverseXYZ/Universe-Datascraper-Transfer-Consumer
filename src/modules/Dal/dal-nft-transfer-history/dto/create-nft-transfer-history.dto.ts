export interface CreateNFTTransferHistoryDto {
  contractAddress: string;
  blockNum: number;
  from: string;
  to: string;
  hash: string;
  value?: string;
  erc721TokenId?: string;
  erc1155Metadata?: any;
  asset?: string;
  category: string;
  timeLastUpdated?: string;
}
