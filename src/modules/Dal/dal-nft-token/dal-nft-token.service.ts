import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LatestOwner } from 'src/modules/TokenHandlers/tokens-handler/interfaces/tokens.interface';
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
  async upsertERC721NFTTokens(tokens: CreateNFTTokenDto[]): Promise<void> {
    this.logger.log(`Bulk write ${tokens.length} ERC721 tokens`);
    await this.nfttokensModel.bulkWrite(
      tokens.map((x) => ({
        updateOne: {
          filter: { contractAddress: x.contractAddress, tokenId: x.tokenId },
          update: {
            contractAddress: x.contractAddress,
            tokenId: x.tokenId,
            blockNumber: x.blockNumber,
            tokenType: x.tokenType,
            firstOwner: x.firstOwner,
          },
          upsert: true,
        },
      })),
    );
  }

  async upsertLatestOwnersForERC721Tokens(latestOwner: LatestOwner[]) {
    this.logger.log(`Upserting ${latestOwner.length} latest owners`);
    await this.nfttokensModel.bulkWrite(
      latestOwner.map((x) => ({
        updateOne: {
          filter: { contractAddress: x.contractAddress, tokenId: x.tokenId },
          update: {
            tokenType: 'ERC721',
            // ERC721 only update one owner at a time
            owners: [
              {
                address: x.ownerAddress,
                transactionHash: x.hash,
                value: 1,
              },
            ],
          },
          upsert: false,
        },
      })),
    );
  }

  //CryptoPunks is non fungible token which only has one tokenId
  async upsertCryptoPunksNFTTokens(tokens: CreateNFTTokenDto[]): Promise<void> {
    this.logger.log(`Bulk write ${tokens.length} CryptoPunks tokens`);
    await this.nfttokensModel.bulkWrite(
      tokens.map((x) => {
        const { contractAddress, tokenId, ...rest } = x;
        return {
          updateOne: {
            filter: { contractAddress: contractAddress, tokenId: tokenId },
            update: { ...rest },
            upsert: true,
          },
        };
      }),
    );
  }

  async upsertLatestOwnersForCryptoPunksTokens(latestOwner: LatestOwner[]) {
    this.logger.log(`Upserting ${latestOwner.length} latest owners`);
    await this.nfttokensModel.bulkWrite(
      latestOwner.map((x) => ({
        updateOne: {
          filter: { contractAddress: x.contractAddress, tokenId: x.tokenId },
          update: {
            $set: {
              tokenType: 'CryptoPunks',
              // CryptoPunks only update one owner at a time
              owners: [
                {
                  address: x.ownerAddress,
                  transactionHash: x.hash,
                  value: 1,
                },
              ],
            },
          },
          upsert: false,
        },
      })),
    );
  }

  async getExistingTokensByContractAddressAndTokenId(
    tokens: CreateNFTTokenDto[],
  ): Promise<NFTToken[]> {
    if (tokens?.length === 0) {
      return [];
    }
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
