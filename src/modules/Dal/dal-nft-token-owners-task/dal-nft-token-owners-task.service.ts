import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Model } from 'mongoose';
import { CreateNFTTokenOwnersTaskDto } from './dto/create-nft-token.dto';
import {
  NFTTokenOwnersTask,
  NFTTokenOwnersTaskDocument,
} from './schemas/nft-token-owners-task.schema';

@Injectable()
export class DalNFTTokenOwnersTaskService {
  private readonly logger = new Logger(DalNFTTokenOwnersTaskService.name);
  constructor(
    @InjectModel(NFTTokenOwnersTask.name)
    private readonly nfttokenOwnerTaskModel: Model<NFTTokenOwnersTaskDocument>,
  ) {}

  async createNFTTokenOwnersTask(tasks: CreateNFTTokenOwnersTaskDto[]) {
    this.logger.log(`Start creating ${tasks.length} NFT token owners tasks`);
    return this.nfttokenOwnerTaskModel.insertMany(
      tasks.map((x) => ({
        contractAddress: x.contractAddress,
        tokenId: x.tokenId,
        priority: 0,
        isProcessing: false,
        tokenType: x.tokenType,
        taskId: uuidv4(),
      })),
      {
        ordered: false,
      },
    );
  }
}
