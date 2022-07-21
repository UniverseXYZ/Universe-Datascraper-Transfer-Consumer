import { Logger } from '@nestjs/common';
import { CreateNFTTokenDto } from '../../Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from '../../Dal/dal-nft-token/dal-nft-token.service';
import {
  Analyser,
  TransferHistory,
} from '../tokens-handler/interfaces/tokens.interface';
import { DalNFTTokenOwnerService } from 'src/modules/Dal/dal-nft-token-owner/dal-nft-token-owner.service';
import {
  getLatestHistory,
  calculateOwners,
} from '../tokens-handler/owners.operators';

export default class CryptoPunksTokenAnalyser implements Analyser {
  private readonly logger = new Logger(CryptoPunksTokenAnalyser.name);

  constructor(
    private readonly nftTokensService: DalNFTTokensService,
    private readonly nftTokenOwnerService: DalNFTTokenOwnerService,
  ) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[], batchSize: number, source: string) {
    this.logger.log(
      `Start handling upcoming ${tokens.length} CryptoPunks tokens`,
    );
    await this.nftTokensService.upsertNFTTokens(tokens, batchSize, source);
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

    const { toBeInsertedOwners, toBeUpdatedOwners } = calculateOwners(
      latestHistory,
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
  }
}
