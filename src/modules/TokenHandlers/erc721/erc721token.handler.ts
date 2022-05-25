import { Injectable, Logger } from '@nestjs/common';
import { DalNFTTokenOwnerService } from 'src/modules/Dal/dal-nft-token-owner/dal-nft-token-owner.service';
import { DalNFTTokensService } from 'src/modules/Dal/dal-nft-token/dal-nft-token.service';
import { DalNFTTransferHistoryService } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.service';
import EthereumService from 'src/modules/Infra/ethereum/ethereum.service';
import { Handler } from '../tokens-handler/interfaces/tokens.interface';
import ERC721TokenAnalyser from './erc721token.analyser';
import ERC721TokenFecther from './erc721token.fetcher';

@Injectable()
export default class ERC721TokenHandler implements Handler {
  private readonly logger = new Logger(ERC721TokenHandler.name);
  private readonly analayser: ERC721TokenAnalyser;
  private readonly fetcher: ERC721TokenFecther;

  constructor(
    private readonly ethereumService: EthereumService,
    private readonly nftTokenService: DalNFTTokensService,
    private readonly nftTransferHistoryService: DalNFTTransferHistoryService,
    private readonly nftTokenOwnerService: DalNFTTokenOwnerService,
  ) {
    this.fetcher = new ERC721TokenFecther(this.ethereumService);
    this.analayser = new ERC721TokenAnalyser(
      this.nftTokenService,
      this.nftTokenOwnerService,
    );
  }

  async handle(contractAddress: string, startBlock: number, endBlock: number, batchSize: number) {
    // Get ERC721 tranfer history and tokens
    const { tokens, transferHistory } =
      await this.fetcher.getTokensAndTransferHistory(
        contractAddress,
        startBlock,
        endBlock,
      );

    this.logger.log(
      `Fetched transfer history(${transferHistory?.length}) and tokens(${tokens.length})`,
    );
    await this.nftTransferHistoryService.createERC721NFTTransferHistoryBatch(
      transferHistory,
    );
    await this.analayser.handleOwners(transferHistory, batchSize);
    await this.analayser.handleUpcomingTokens(tokens, batchSize);
  }
}
