import { Injectable, Logger } from '@nestjs/common';
import { EthereumService } from 'src/modules/Infra/ethereum/ethereum.service';
import CryptoPunksTokenHandler from '../cryptopunks/cryptopunks.handler';
import ERC1155TokenHandler from '../erc1155/erc1155token.handler';
import ERC721TokenHandler from '../erc721/erc721token.handler';
import { handleDBError } from './errors.handler';

@Injectable()
export default class TokensHandler {
  private readonly logger = new Logger(TokensHandler.name);

  constructor(
    private readonly erc721TokenHandler: ERC721TokenHandler,
    private readonly erc1155TokenHandler: ERC1155TokenHandler,
    private readonly cryptoPunksTokenHandler: CryptoPunksTokenHandler,
    private readonly ethereumService: EthereumService,
  ) {}

  async start(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
    tokenType: string,
    batchSize: number,
    source: string
  ) {
    const currentTimestamp = new Date().getTime() / 1000;
    try {
      switch (tokenType) {
        case 'ERC721':
          await this.erc721TokenHandler.handle(
            contractAddress,
            startBlock,
            endBlock,
            batchSize,
            source,
          );
          break;
        case 'ERC1155':
          await this.erc1155TokenHandler.handle(
            contractAddress,
            startBlock,
            endBlock,
            batchSize,
            source,
          );
          break;
        case 'CryptoPunks':
          await this.cryptoPunksTokenHandler.handle(
            contractAddress,
            startBlock,
            endBlock,
            batchSize,
            source,
          );
          break;
        default:
          return;
      }
    } catch (error) {
      if (error?.error?.reason === 'timeout' || error?.error?.code === 429) {
        return await this.ethereumService.connectToProvider(() => this.start(contractAddress, startBlock, endBlock, tokenType, batchSize, source));
      }

      handleDBError(error);
    } finally {
      const endTimestamp = new Date().getTime() / 1000;
      this.logger.log(
        `[${contractAddress}-${startBlock}-${endBlock}] total processing time spent: ${
          endTimestamp - currentTimestamp
        } seconds`,
      );
    }
  }
}
