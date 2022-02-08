import { Module } from '@nestjs/common';
import { DalNFTTransferHistoryModule } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.module';
import { EthereumModule } from 'src/modules/Infra/ethereum/ethereum.module';
import { DalNFTTokensModule } from '../../Dal/dal-nft-token/dal-nft-token.module';
import ERC721TokenHandler from './erc721token.handler';

@Module({
  imports: [EthereumModule, DalNFTTokensModule, DalNFTTransferHistoryModule],
  providers: [ERC721TokenHandler],
  exports: [ERC721TokenHandler],
})
export class ERC721Module {}
