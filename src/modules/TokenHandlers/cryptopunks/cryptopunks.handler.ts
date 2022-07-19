import { Injectable, Logger } from '@nestjs/common';
import { DalNFTTokenOwnerService } from 'src/modules/Dal/dal-nft-token-owner/dal-nft-token-owner.service';
import { DalNFTTokensService } from 'src/modules/Dal/dal-nft-token/dal-nft-token.service';
import { DalNFTTransferHistoryService } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.service';
import { EthereumService } from 'src/modules/Infra/ethereum/ethereum.service';
import { Handler } from '../tokens-handler/interfaces/tokens.interface';
import CryptoPunksTokenAnalyser from './cryptopunks.analyser';
import CryptoPunksTokenFecther from './cryptopunks.fetcher';

@Injectable()
export default class CryptoPunksTokenHandler implements Handler {
  private readonly logger = new Logger(CryptoPunksTokenHandler.name);
  private readonly analayser: CryptoPunksTokenAnalyser;
  private readonly fetcher: CryptoPunksTokenFecther;

  constructor(
    private readonly ethereumService: EthereumService,
    private readonly nftTokenService: DalNFTTokensService,
    private readonly nftTransferHistoryService: DalNFTTransferHistoryService,
    private readonly nftTokenOwnerService: DalNFTTokenOwnerService,
  ) {
    this.fetcher = new CryptoPunksTokenFecther(this.ethereumService);
    this.analayser = new CryptoPunksTokenAnalyser(
      this.nftTokenService,
      this.nftTokenOwnerService,
    );
  }

  async handle(contractAddress: string, startBlock: number, endBlock: number, batchSize: number) {
    // Get 1155 tranfer history and tokens
    const { tokens, transferHistory } =
      await this.fetcher.getTokensAndTransferHistory(
        contractAddress,
        startBlock,
        endBlock,
      );

    this.logger.log(
      `Fetched CryptoPunks transfer history(${transferHistory?.length}) and tokens(${tokens.length})`,
    );
    await this.nftTransferHistoryService.createCryptoPunksNFTTransferHistoryBatch(
      transferHistory,
      batchSize
    );
    await this.analayser.handleOwners(transferHistory, batchSize);
    await this.analayser.handleUpcomingTokens(tokens, batchSize);
  }
}
