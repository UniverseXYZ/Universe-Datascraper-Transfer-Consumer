import { Module } from '@nestjs/common';
import { DalNFTTokensModule } from 'src/modules/Dal/dal-nft-token/dal-nft-token.module';
import { DalNFTTransferHistoryModule } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.module';
import { EthereumModule } from 'src/modules/Infra/ethereum/ethereum.module';
import ERC1155TokenHandler from './erc1155token.handler';

@Module({
  imports: [EthereumModule, DalNFTTokensModule, DalNFTTransferHistoryModule],
  providers: [ERC1155TokenHandler],
  exports: [ERC1155TokenHandler],
})
export class ERC1155Module {}
