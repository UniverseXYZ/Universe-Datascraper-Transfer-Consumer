import { Module } from '@nestjs/common';
import { CryptoPunksModule } from '../cryptopunks/cryptopunks.module';
import { ERC1155Module } from '../erc1155/erc1155.module';
import { ERC721Module } from '../erc721/erc721.module';
import TokensHandler from './tokens.handler';

@Module({
  imports: [ERC721Module, ERC1155Module, CryptoPunksModule],
  providers: [TokensHandler],
  exports: [TokensHandler],
})
export class TokensHandlerModule {}
