import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNFTTransferHistoryDto } from './dto/create-nft-transfer-history.dto';
import {
  NFTTransferHistory,
  NFTTransferHistoryDocument,
} from './schemas/nft-transfer-history.schema';

@Injectable()
export class DalNFTTransferHistoryService {
  private readonly logger = new Logger(DalNFTTransferHistoryService.name);
  constructor(
    @InjectModel(NFTTransferHistory.name)
    private readonly nftTransferHistoryModel: Model<NFTTransferHistoryDocument>,
  ) {}

  async createNFTTransferHistory(
    transferHistory: CreateNFTTransferHistoryDto,
  ): Promise<void> {
    await this.nftTransferHistoryModel.create(transferHistory);
  }

  async createERC721NFTTransferHistoryBatch(
    transferHistory: CreateNFTTransferHistoryDto[],
  ): Promise<void> {
    this.logger.log(`Bulk write ${transferHistory.length} transfer histories`);
    await this.nftTransferHistoryModel.bulkWrite(
      transferHistory.map((x) => ({
        updateOne: {
          filter: {
            erc721Tokenid: x.erc721TokenId,
            contractAddress: x.contractAddress,
            hash: x.hash,
          },
          update: { $set: x },
          upsert: true,
        },
      })),
    );
  }

  async createERC1155NFTTransferHistoryBatch(
    transferHistory: CreateNFTTransferHistoryDto[],
  ): Promise<void> {
    this.logger.log(`Bulk write ${transferHistory.length} transfer histories`);

    await this.nftTransferHistoryModel.bulkWrite(
      transferHistory.map((x) => {
        const { hash, ...rest } = x;
        return {
          updateOne: {
            filter: {
              blockNum: x.blockNum,
              contractAddress: x.contractAddress,
              hash: hash,
              category: 'ERC1155',
              'erc1155Metadata.tokenId': x.erc1155Metadata.tokenId,
            },
            update: { $set: { ...rest } },
            upsert: true,
          },
        };
      }),
    );
  }
}
