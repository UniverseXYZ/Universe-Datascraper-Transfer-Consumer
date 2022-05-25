import { Logger } from '@nestjs/common';
import { CreateNFTTokenDto } from 'src/modules/Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from 'src/modules/Dal/dal-nft-token/dal-nft-token.service';
import { Analyser } from '../tokens-handler/interfaces/tokens.interface';
import { DalNFTTokenOwnersTaskService } from 'src/modules/Dal/dal-nft-token-owners-task/dal-nft-token-owners-task.service';

export default class ERC1155TokenAnalyser implements Analyser {
  private readonly logger = new Logger(ERC1155TokenAnalyser.name);

  constructor(
    private readonly nftTokensService: DalNFTTokensService,
    private readonly nftTokenOwnersTaskService: DalNFTTokenOwnersTaskService,
  ) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[], batchSize: number) {
    this.logger.log(`Handle upcoming ${tokens.length} ERC1155 tokens`);
    this.logger.log(`Upsert ${tokens.length} ERC1155 tokens | Batch size: ${batchSize}`);
    await this.nftTokensService.upsertNFTTokens(tokens, batchSize);

    await this.nftTokenOwnersTaskService.createNFTTokenOwnersTask(
      tokens.map((t) => ({
        tokenId: t.tokenId,
        contractAddress: t.contractAddress,
        priority: 0,
        isProcessing: false,
        tokenType: t.tokenType,
      })),
    );
  }
}
