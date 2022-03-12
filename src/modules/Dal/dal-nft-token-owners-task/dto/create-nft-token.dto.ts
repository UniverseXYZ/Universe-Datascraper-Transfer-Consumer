export interface CreateNFTTokenOwnersTaskDto {
  contractAddress: string;
  tokenId: string;
  priority: number;
  tokenType: string;
  isProcessing: boolean;
}
