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

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[]) {
    this.logger.log(`Start handling upcoming ${tokens.length} ERC721 tokens`);
    await this.nftTokensService.upsertNFTTokens(tokens);
  }

  async handleOwners(transferHistories: TransferHistory[]) {
    if (transferHistories.length === 0) return;

    this.logger.log('Start handling token owners');

    const latestHistory = getLatestHistory(transferHistories);

    const owners = await this.nftTokenOwnerService.getERC721NFTTokenOwners(
      latestHistory.map((x) => ({
        contractAddress: x.contractAddress,
        tokenId: x.tokenId,
      })),
    );

    const { toBeInsertedOwners, toBeUpdatedOwners } = calculateOwners(
      latestHistory,
      owners,
    );

    await this.nftTokenOwnerService.upsertERC721NFTTokenOwners(
      toBeInsertedOwners,
    );

    await this.nftTokenOwnerService.updateERC721NFTTokenOwners(
      toBeUpdatedOwners,
    );
  }
}
