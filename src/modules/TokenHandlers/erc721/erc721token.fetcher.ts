import { Logger } from '@nestjs/common';
import { Owner } from 'datascraper-schema';
import { ethers } from 'ethers';
import R from 'ramda';
import EthereumService from 'src/modules/Infra/ethereum/ethereum.service';
import { handleSizeExceed } from '../tokens-handler/errors.handler';
import {
  Token,
  TokenTransferFetcher,
  TransferHistory,
} from '../tokens-handler/interfaces/tokens.interface';
import { getTokens, getTransferHistory } from './event-mapper';

export default class ERC721TokenFecther implements TokenTransferFetcher {
  private ether: ethers.providers.BaseProvider;
  private readonly logger = new Logger(ERC721TokenFecther.name);

  constructor(private readonly ethereumService: EthereumService) {
    this.ether = this.ethereumService.getEther();
  }
  async getTokensAndTransferHistory(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<{
    tokens: Token[];
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
      const groupedTransferHistory =
        this.groupTransferHistoryByTokenId(transferHistory);

      const tokens = await getTokens(contractAddress, results);
      const tokensWithCurrentOwner = tokens.map((x) => {
        const sortedHistories = (
          groupedTransferHistory[x.tokenId] as TransferHistory[]
        ).sort((a, b) => b.blockNum - a.blockNum);

        const owner = {
          address: sortedHistories[sortedHistories.length - 1].to, // last transfer history's toAddress
          transactionHash: sortedHistories[sortedHistories.length - 1].hash,
          value: 1,
        } as Owner;

        return {
          ...x,
          blockNumber: sortedHistories[sortedHistories.length - 1].blockNum,
          firstOwner: x.toAddress,
          owners: [owner],
        } as Token;
      });

      this.logger.log(
        `Got ${tokens.length} tokens and ${transferHistory.length} transfer histories.`,
      );

      return { tokens: tokensWithCurrentOwner as Token[], transferHistory };
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
}
