import { Module } from '@nestjs/common';
import { DalNFTTokenOwnerModule } from 'src/modules/Dal/dal-nft-token-owner/dal-nft-token-owner.module';
import { DalNFTTransferHistoryModule } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.module';
import { EthereumModule } from 'src/modules/Infra/ethereum/ethereum.module';
import { DalNFTTokensModule } from '../../Dal/dal-nft-token/dal-nft-token.module';
import CryptoPunksTokenHandler from './cryptopunks.handler';

@Module({
  imports: [
    EthereumModule,
    DalNFTTokensModule,
    DalNFTTransferHistoryModule,
    DalNFTTokenOwnerModule,
  ],
  providers: [CryptoPunksTokenHandler],
  exports: [CryptoPunksTokenHandler],
})
export class CryptoPunksModule {}
