import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNFTTokenDto } from './dto/create-nft-token.dto';
import { NFTToken, NFTTokensDocument } from './schemas/nft-token.schema';

@Injectable()
export class DalNFTTokensService {
  private readonly logger = new Logger(DalNFTTokensService.name);
  constructor(
    @InjectModel(NFTToken.name)
    private readonly nfttokensModel: Model<NFTTokensDocument>,
  ) {}

  async upsertNFTTokens(tokens: CreateNFTTokenDto[], batchSize: number, source: string): Promise<void> {
    this.logger.log(`Bulk write ${tokens.length} tokens | Batch size: ${batchSize}`);
    for (let i = 0; i < tokens.length; i+=batchSize) {
      const tokensBatch = tokens.slice(i, i + batchSize);
      
      await this.nfttokensModel.bulkWrite(
        tokensBatch.map((x) => ({
          updateOne: {
            filter: { contractAddress: x.contractAddress, tokenId: x.tokenId },
            update: {
              contractAddress: x.contractAddress,
              tokenId: x.tokenId,
              tokenType: x.tokenType,
              source,
            },
            upsert: true,
          },
        })),
        {
          ordered: false,
        },
      );
  
      this.logger.log(`Batch ${i / batchSize + 1} completed`);
    }
  }
}
