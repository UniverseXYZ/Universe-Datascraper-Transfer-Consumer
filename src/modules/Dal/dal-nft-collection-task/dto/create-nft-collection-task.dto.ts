export class CreateNFTCollectionTaskDto {
  messageId: string;
  contractAddress: string;
  startBlock: number;
  endBlock: number;
  status: string;
  errorMessage?: string;
}
