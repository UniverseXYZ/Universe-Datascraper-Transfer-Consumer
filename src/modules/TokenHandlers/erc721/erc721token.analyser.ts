import { Logger } from '@nestjs/common';
import { CreateNFTTokenDto } from '../../Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from '../../Dal/dal-nft-token/dal-nft-token.service';
import { DalNFTTokenOwnerService } from 'src/modules/Dal/dal-nft-token-owner/dal-nft-token-owner.service';
import {
  Analyser,
  TransferHistory,
} from '../tokens-handler/interfaces/tokens.interface';
import {
  calculateOwners,
  getLatestHistory,
} from '../tokens-handler/owners.operators';

export default class ERC721TokenAnalyser implements Analyser {
  private readonly logger = new Logger(ERC721TokenAnalyser.name);

  constructor(
    private readonly nftTokensService: DalNFTTokensService,
    private readonly nftTokenOwnerService: DalNFTTokenOwnerService,
  ) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[], batchSize: number) {
    this.logger.log(`Start handling upcoming ${tokens.length} ERC721 tokens | Batch size: ${batchSize}`);
    await this.nftTokensService.upsertNFTTokens(tokens, batchSize);
  }

  async handleOwners(transferHistories: TransferHistory[], batchSize: number) {
    if (transferHistories.length === 0) return;

    this.logger.log('Start handling token owners');

    const latestHistory = getLatestHistory(transferHistories);
    
    this.logger.log('Fetching token owners');

    const owners = await this.nftTokenOwnerService.getERC721NFTTokenOwners(
      latestHistory.map((x) => ({
        contractAddress: x.contractAddress,
        tokenId: x.tokenId,
      })),
    );

    this.logger.log('Calculating token owners');

    for (let i = 0; i < latestHistory.length; i+= batchSize) {
      const historyBatch = latestHistory.slice(i, i + batchSize);
      
      const { toBeInsertedOwners, toBeUpdatedOwners } = calculateOwners(
        historyBatch,
        owners,
      );
  
      await this.nftTokenOwnerService.upsertERC721NFTTokenOwners(
        toBeInsertedOwners,
        batchSize,
      );
  
      await this.nftTokenOwnerService.updateERC721NFTTokenOwners(
        toBeUpdatedOwners,
        batchSize,
      );
      
      this.logger.log(`Completed token owners batch ${ i / batchSize + 1}`);
    }
  }
}
