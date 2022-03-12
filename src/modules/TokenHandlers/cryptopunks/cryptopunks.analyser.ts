import { Logger } from '@nestjs/common';
import { CreateNFTTokenDto } from '../../Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from '../../Dal/dal-nft-token/dal-nft-token.service';
import { Analyser } from '../tokens-handler/interfaces/tokens.interface';
import { DalNFTTokenOwnersTaskService } from 'src/modules/Dal/dal-nft-token-owners-task/dal-nft-token-owners-task.service';

export default class CryptoPunksTokenAnalyser implements Analyser {
  private readonly logger = new Logger(CryptoPunksTokenAnalyser.name);

  constructor(
    private readonly nftTokensService: DalNFTTokensService,
    private readonly nftTokenOwnersTaskService: DalNFTTokenOwnersTaskService,
  ) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[]) {
    this.logger.log(
      `Start handling upcoming ${tokens.length} CryptoPunks tokens`,
    );
    await this.nftTokensService.upsertNFTTokens(tokens);
    await this.nftTokenOwnersTaskService.createNFTTokenOwnersTask(
      tokens.map((t) => ({
        tokenId: t.tokenId,
        contractAddress: t.contractAddress,
        tokenType: t.tokenType,
        priority: 0,
        isProcessing: false,
      })),
    );
  }
}
