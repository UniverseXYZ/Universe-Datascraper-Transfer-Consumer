import { Injectable, Logger } from '@nestjs/common';
import { DalNFTTokensService } from 'src/modules/Dal/dal-nft-token/dal-nft-token.service';
import { DalNFTTransferHistoryService } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.service';
import EthereumService from 'src/modules/Infra/ethereum/ethereum.service';
import ERC721TokenAnalyser from './erc721token.analyser';
import ERC721TokenFecther from './erc721token.fetcher';

@Injectable()
export default class ERC721TokenHandler {
  private readonly logger = new Logger(ERC721TokenHandler.name);
  private readonly analayser: ERC721TokenAnalyser;
  private readonly fetcher: ERC721TokenFecther;

  constructor(
    private readonly ethereumService: EthereumService,
    private readonly nftTokenService: DalNFTTokensService,
    private readonly nftTransferHistoryService: DalNFTTransferHistoryService,
  ) {
    this.fetcher = new ERC721TokenFecther(this.ethereumService);
    this.analayser = new ERC721TokenAnalyser(this.nftTokenService);
  }

  async handle(contractAddress: string, startBlock: number, endBlock: number) {
    // Get 1155 tranfer history and tokens
    const { tokens, transferHistory } =
      await this.fetcher.getTokensAndTransferHistory(
        contractAddress,
        startBlock,
        endBlock,
      );

    this.logger.log(
      `Fetched transfer history(${transferHistory?.length}) and tokens(${tokens.length})`,
    );
    await this.analayser.handleUpcomingTokens(tokens);
    await this.nftTransferHistoryService.createERC721NFTTransferHistoryBatch(
      transferHistory,
    );
  }
}
