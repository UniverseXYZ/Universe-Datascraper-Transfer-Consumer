import { Injectable, Logger } from '@nestjs/common';
import { DalNFTTokensService } from 'src/modules/Dal/dal-nft-token/dal-nft-token.service';
import { DalNFTTransferHistoryService } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.service';
import EthereumService from 'src/modules/Infra/ethereum/ethereum.service';
import ERC1155TokenAnalyser from './erc1155token.analyser';
import ERC1155TokenFecther from './erc1155token.fetcher';

@Injectable()
export default class ERC1155TokenHandler {
  private readonly logger = new Logger(ERC1155TokenHandler.name);
  private readonly analayser: ERC1155TokenAnalyser;
  private readonly fetcher: ERC1155TokenFecther;

  constructor(
    private readonly ethereumService: EthereumService,
    private readonly nftTokenService: DalNFTTokensService,
    private readonly nftTransferHistoryService: DalNFTTransferHistoryService,
  ) {
    this.fetcher = new ERC1155TokenFecther(this.ethereumService);
    this.analayser = new ERC1155TokenAnalyser(this.nftTokenService);
  }

  async handle(contractAddress: string, startBlock: number, endBlock: number) {
    // Get ERC1155 tranfer history and tokens
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
    await this.nftTransferHistoryService.createERC1155NFTTransferHistoryBatch(
      transferHistory,
    );
  }
}
