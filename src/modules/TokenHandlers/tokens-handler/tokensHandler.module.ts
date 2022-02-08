import { Module } from '@nestjs/common';
import { ERC1155Module } from '../erc1155/erc1155.module';
import { ERC721Module } from '../erc721/erc721.module';
import TokensHandler from './tokens.handler';

@Module({
  imports: [ERC721Module, ERC1155Module],
  providers: [TokensHandler],
  exports: [TokensHandler],
})
export class TokensHandlerModule {}
