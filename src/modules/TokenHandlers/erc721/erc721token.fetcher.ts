import { Logger } from '@nestjs/common';
import { Owner } from 'datascraper-schema';
import { ethers } from 'ethers';
import R from 'ramda';
import EthereumService from 'src/modules/Infra/ethereum/ethereum.service';
import { handleSizeExceed } from '../tokens-handler/errors.handler';
import {
  LatestOwner,
  Token,
  TokenWithLatestOwnerTransferFetcher,
  TransferHistory,
} from '../tokens-handler/interfaces/tokens.interface';
import { getTokens, getTransferHistory } from './event-mapper';

export default class ERC721TokenFecther
  implements TokenWithLatestOwnerTransferFetcher
{
  private ether: ethers.providers.BaseProvider;
  private readonly logger = new Logger(ERC721TokenFecther.name);

  constructor(private readonly ethereumService: EthereumService) {
    this.ether = this.ethereumService.getEther();
  }
  async getTokensWithLatestOwnersAndTransferHistory(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<{
    tokens: Token[];
    latestOwners: LatestOwner[];
    transferHistory: TransferHistory[];
  }> {
    this.ether = this.ethereumService.getEther();
    try {
      this.logger.log(
        `Start to get contractAddress(${contractAddress}) in block(${startBlock}-${endBlock})'s transfer history`,
      );

      const results = await this.getResult(
        contractAddress,
        startBlock,
        endBlock,
      );

      this.logger.log(
        `Got ${results.length} transfer events for contractAddress(${contractAddress}) between block(${startBlock}-${endBlock})`,
      );

      const transferHistory = await getTransferHistory(
        contractAddress,
        results,
      );

      const originalTokens = await getTokens(contractAddress, results);
      const tokens = this.removeDuplicateTokens(originalTokens);

      this.logger.log(
        `Got ${tokens.length} tokens and ${transferHistory.length} transfer histories.`,
      );

      const latestOwners = this.getLatestOwners(
        transferHistory.sort((a, b) => a.blockNum - b.blockNum),
      );

      return {
        tokens,
        latestOwners,
        transferHistory,
      };
    } catch (error) {
      console.log(error);
      this.logger.log(`Error when getting transfer history - ${error}`);
      handleSizeExceed(error);
    }
  }

  private async getResult(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<ethers.Event[]> {
    const ERC721_ABI = [
      'event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId)',
    ];
    const contract = new ethers.Contract(
      contractAddress,
      ERC721_ABI,
      this.ether,
    );

    const allTransferFilter = contract.filters.Transfer();
    const results = await contract.queryFilter(
      allTransferFilter,
      `0x${startBlock.toString(16)}`,
      `0x${endBlock.toString(16)}`,
    );
    return results;
  }

  private groupTransferHistoryByTokenId(transferHistories: TransferHistory[]) {
    const groupByTokenId = R.groupBy((history: TransferHistory) => {
      return history.erc721TokenId;
    });

    const grouped = groupByTokenId(transferHistories);

    return grouped;
  }

  private removeDuplicateTokens(
    tokens: {
      contractAddress: string;
      fromAddress: any;
      toAddress: any;
      tokenId: string;
      tokenType: string;
    }[],
  ) {
    const cleanTokens = [];

    for (const token of tokens) {
      const isDuplicate = cleanTokens.some(
        (x) =>
          x.tokenId === token.tokenId &&
          x.contractAddress === token.contractAddress,
      );

      if (!isDuplicate) {
        cleanTokens.push(token);
      }
    }

    return cleanTokens;
  }

  private getLatestOwners(allHistories: TransferHistory[]) {
    const groupedTransferHistories =
      this.groupTransferHistoryByTokenId(allHistories);

    const latestOwners = Object.keys(groupedTransferHistories).map(
      (tokenId) => {
        // sort descending
        const historiesWithTokenId = groupedTransferHistories[tokenId].sort(
          (a, b) => b.blockNum - a.blockNum,
        );

        return {
          ownerAddress: historiesWithTokenId[0].to,
          hash: historiesWithTokenId[0].hash,
          contractAddress: historiesWithTokenId[0].contractAddress,
          tokenId: historiesWithTokenId[0].tokenId,
          blockNumber: historiesWithTokenId[0].blockNum,
        } as LatestOwner;
      },
    );
    return latestOwners;
  }
}
