import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNFTCollectionTaskDto } from './dto/create-nft-collection-task.dto';
import {
  NFTCollectionTask,
  NFTCollectionTaskDocument,
} from './schemas/nft-collection-task.schema';

@Injectable()
export class DalNFTCollectionTaskService {
  private readonly logger = new Logger(DalNFTCollectionTaskService.name);
  constructor(
    @InjectModel(NFTCollectionTask.name)
    private readonly NFTCollectionTaskModel: Model<NFTCollectionTaskDocument>,
  ) {}

  async updateNFTCollectionTask(
    task: CreateNFTCollectionTaskDto,
  ): Promise<void> {
    this.logger.log(`update task ${task.messageId} status (${task.status})`);
    await this.NFTCollectionTaskModel.updateOne(
      { messageId: task.messageId },
      { $set: { ...task } },
      { upsert: true },
    );
  }

  async removeNFTCollectionTask(messageId: string) {
    this.logger.log(`remove task ${messageId}`);
    await this.NFTCollectionTaskModel.deleteOne({
      messageId,
    });
  }
}
