import { Module } from '@nestjs/common';
import { DalNFTTokenOwnersTaskModule } from 'src/modules/Dal/dal-nft-token-owners-task/dal-nft-token-owners-task.module';
import { DalNFTTransferHistoryModule } from 'src/modules/Dal/dal-nft-transfer-history/dal-nft-transfer-history.module';
import { EthereumModule } from 'src/modules/Infra/ethereum/ethereum.module';
import { DalNFTTokensModule } from '../../Dal/dal-nft-token/dal-nft-token.module';
import CryptoPunksTokenHandler from './cryptopunks.handler';

@Module({
  imports: [
    EthereumModule,
    DalNFTTokensModule,
    DalNFTTransferHistoryModule,
    DalNFTTokenOwnersTaskModule,
  ],
  providers: [CryptoPunksTokenHandler],
  exports: [CryptoPunksTokenHandler],
})
export class CryptoPunksModule {}
