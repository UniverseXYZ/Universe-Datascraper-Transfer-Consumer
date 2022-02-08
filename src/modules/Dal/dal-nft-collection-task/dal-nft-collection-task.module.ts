import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DalNFTCollectionTaskService } from './dal-nft-collection-task.service';
import {
  NFTCollectionTask,
  NFTCollectionTaskSchema,
} from './schemas/nft-collection-task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTCollectionTask.name, schema: NFTCollectionTaskSchema },
    ]),
  ],
  providers: [DalNFTCollectionTaskService],
  exports: [DalNFTCollectionTaskService],
})
export class DalNFTCollectionTaskModule {}
