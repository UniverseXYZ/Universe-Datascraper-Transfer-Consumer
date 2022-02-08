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

  //ERC721 is non fungible token which only has one tokenId
  async upsertNFTTokens(tokens: CreateNFTTokenDto[]): Promise<void> {
    this.logger.log(`Bulk write ${tokens.length} ERC721 tokens`);
    await this.nfttokensModel.bulkWrite(
      tokens.map((x) => ({
        updateOne: {
          filter: { contractAddress: x.contractAddress, tokenId: x.tokenId },
          update: { ...x },
          upsert: true,
        },
      })),
    );
  }

  async getExistingTokensByContractAddressAndTokenId(
    tokens: CreateNFTTokenDto[],
  ): Promise<NFTToken[]> {
    //build query
    const query = {
      $or: tokens.map((x) => ({
        contractAddress: x.contractAddress,
        tokenId: x.tokenId,
      })),
    };
    //query all the tokens that have the same contract address and tokenId
    const existingTokens = await this.nfttokensModel.find(query);
    return existingTokens;
  }

  async insertTokens(toBeInsertedTokens: CreateNFTTokenDto[]) {
    this.logger.log(`Inserting ${toBeInsertedTokens.length} ERC1155 tokens`);
    await this.nfttokensModel.insertMany(toBeInsertedTokens);
  }

  async updateTokens(toBeUpdatedTokens: CreateNFTTokenDto[]) {
    this.logger.log(`Updating ${toBeUpdatedTokens.length} ERC1155 tokens`);
    await this.nfttokensModel.bulkWrite(
      toBeUpdatedTokens.map((x) => ({
        updateOne: {
          filter: { contractAddress: x.contractAddress, tokenId: x.tokenId },
          update: { $set: { ...x } },
          upsert: false,
        },
      })),
    );
  }
}
