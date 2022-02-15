import { Logger } from '@nestjs/common';
import { CreateNFTTokenDto } from '../../Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from '../../Dal/dal-nft-token/dal-nft-token.service';
import { Analyser } from '../tokens-handler/interfaces/tokens.interface';

export default class CryptoPunksTokenAnalyser implements Analyser {
  private readonly logger = new Logger(CryptoPunksTokenAnalyser.name);

  constructor(private readonly nftTokensService: DalNFTTokensService) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[]) {
    this.logger.log(
      `Start handling upcoming ${tokens.length} CryptoPunks tokens`,
    );
    this.nftTokensService.upsertCryptoPunksNFTTokens(tokens);
  }
}
