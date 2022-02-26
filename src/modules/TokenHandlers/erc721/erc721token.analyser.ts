import { Logger } from '@nestjs/common';
import { CreateNFTTokenDto } from '../../Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from '../../Dal/dal-nft-token/dal-nft-token.service';
import { Analyser } from '../tokens-handler/interfaces/tokens.interface';

export default class ERC721TokenAnalyser implements Analyser {
  private readonly logger = new Logger(ERC721TokenAnalyser.name);

  constructor(private readonly nftTokensService: DalNFTTokensService) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[]) {
    this.logger.log(`Start handling upcoming ${tokens.length} ERC721 tokens`);
    await this.nftTokensService.upsertERC721NFTTokens(tokens);
  }
}
