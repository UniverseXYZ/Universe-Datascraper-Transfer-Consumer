import { Injectable, Logger } from '@nestjs/common';
import { DalNFTTokensService } from 'src/modules/Dal/dal-nft-token/dal-nft-token.service';
import { DalNFTTransferHistoryService } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.service';
import EthereumService from 'src/modules/Infra/ethereum/ethereum.service';
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
  ) {
    this.fetcher = new CryptoPunksTokenFecther(this.ethereumService);
    this.analayser = new CryptoPunksTokenAnalyser(this.nftTokenService);
  }

  async handle(contractAddress: string, startBlock: number, endBlock: number) {
    // Get 1155 tranfer history and tokens
    const { tokens, latestOwners, transferHistory } =
      await this.fetcher.getTokensWithLatestOwnersAndTransferHistory(
        contractAddress,
        startBlock,
        endBlock,
      );

    this.logger.log(
      `Fetched transfer history(${transferHistory?.length}) and tokens(${tokens.length})`,
    );
    await this.analayser.handleUpcomingTokens(tokens);
    await this.nftTokenService.upsertLatestOwnersForCryptoPunksTokens(
      latestOwners,
    );
    await this.nftTransferHistoryService.createCryptoPunksNFTTransferHistoryBatch(
      transferHistory,
    );
  }
}
