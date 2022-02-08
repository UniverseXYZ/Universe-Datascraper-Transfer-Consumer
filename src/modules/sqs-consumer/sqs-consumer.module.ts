import { Module } from '@nestjs/common';
import { DalNFTCollectionTaskModule } from '../Dal/dal-nft-collection-task/dal-nft-collection-task.module';
import { TokensHandlerModule } from '../TokenHandlers/tokens-handler/tokensHandler.module';
import { SqsConsumerService } from './sqs-consumer.service';

@Module({
  imports: [TokensHandlerModule, DalNFTCollectionTaskModule],
  providers: [SqsConsumerService],
  exports: [SqsConsumerService],
})
export class SqsConsumerModule {}
