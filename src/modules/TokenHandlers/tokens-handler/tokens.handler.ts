import { Injectable, Logger } from '@nestjs/common';
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
  ) {}

  async start(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
    tokenType: string,
  ) {
    try {
      switch (tokenType) {
        case 'ERC721':
          await this.erc721TokenHandler.handle(
            contractAddress,
            startBlock,
            endBlock,
          );
          break;
        case 'ERC1155':
          await this.erc1155TokenHandler.handle(
            contractAddress,
            startBlock,
            endBlock,
          );
          break;
        case 'CryptoPunks':
          await this.cryptoPunksTokenHandler.handle(
            contractAddress,
            startBlock,
            endBlock,
          );
          break;
        default:
          return;
      }
    } catch (error) {
      handleDBError(error);
    }
  }
}
