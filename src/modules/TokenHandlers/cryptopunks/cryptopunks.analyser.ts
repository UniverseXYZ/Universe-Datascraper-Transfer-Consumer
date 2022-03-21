import { Logger } from '@nestjs/common';
import { CreateNFTTokenDto } from '../../Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from '../../Dal/dal-nft-token/dal-nft-token.service';
import {
  Analyser,
  TransferHistory,
} from '../tokens-handler/interfaces/tokens.interface';
import { DalNFTTokenOwnerService } from 'src/modules/Dal/dal-nft-token-owner/dal-nft-token-owner.service';
import { NFTTokenOwner } from 'datascraper-schema';
import R from 'ramda';

export default class CryptoPunksTokenAnalyser implements Analyser {
  private readonly logger = new Logger(CryptoPunksTokenAnalyser.name);

  constructor(
    private readonly nftTokensService: DalNFTTokensService,
    private readonly nftTokenOwnerService: DalNFTTokenOwnerService,
  ) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[]) {
    this.logger.log(
      `Start handling upcoming ${tokens.length} CryptoPunks tokens`,
    );
    await this.nftTokensService.upsertNFTTokens(tokens);
  }

  async handleOwners(transferHistories: TransferHistory[]) {
    if (transferHistories.length === 0) return;

    this.logger.log('Start handling CryptoPunks token owners');

    const latestHistory = this.getLatestHistory(transferHistories);

    const owners = await this.nftTokenOwnerService.getERC721NFTTokenOwners(
      latestHistory.map((x) => ({
        contractAddress: x.contractAddress,
        tokenId: x.tokenId,
      })),
    );

    const { toBeInsertedOwners, toBeUpdatedOwners } = this.calculateOwners(
      latestHistory,
      owners,
    );

    await this.nftTokenOwnerService.upsertERC721NFTTokenOwners(
      toBeInsertedOwners,
    );

    await this.nftTokenOwnerService.updateERC721NFTTokenOwners(
      toBeUpdatedOwners,
    );
  }

  private calculateOwners(
    latestHistory: TransferHistory[],
    owners: NFTTokenOwner[],
  ) {
    const toBeInsertedOwners = [];
    const toBeUpdatedOwners = [];

    for (const history of latestHistory) {
      const { tokenId, contractAddress, to, blockNum, logIndex, category } =
        history;

      const owner = owners.find(
        (x) => x.tokenId === tokenId && x.contractAddress === contractAddress,
      );

      const newOwner = {
        tokenId,
        contractAddress,
        address: to,
        blockNum,
        logIndex,
        tokenType: category,
        transactionHash: history.hash,
        value: '1',
      };

      if (!owner) {
        toBeInsertedOwners.push(newOwner);
        continue;
      }
      if (owner.blockNum > blockNum) continue;

      if (owner.blockNum === blockNum && owner.logIndex > logIndex) continue;

      toBeUpdatedOwners.push(newOwner);
    }

    return { toBeInsertedOwners, toBeUpdatedOwners };
  }

  private getLatestHistory(transferHistories: TransferHistory[]) {
    const groupedTransferHistories =
      this.groupTransferHistoryByTokenId(transferHistories);

    const latestTransferHistory = Object.keys(groupedTransferHistories).map(
      (tokenId) => {
        // sort descending
        const historiesWithTokenId = groupedTransferHistories[tokenId].sort(
          (a, b) => b.blockNum - a.blockNum,
        );

        return historiesWithTokenId[0];
      },
    );
    return latestTransferHistory;
  }

  private groupTransferHistoryByTokenId(transferHistories: TransferHistory[]) {
    const groupByTokenId = R.groupBy((history: TransferHistory) => {
      return history.tokenId;
    });

    const grouped = groupByTokenId(transferHistories);

    return grouped;
  }
}
