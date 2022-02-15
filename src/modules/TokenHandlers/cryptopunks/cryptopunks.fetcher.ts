import { Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import R from 'ramda';
import EthereumService from 'src/modules/Infra/ethereum/ethereum.service';
import { handleSizeExceed } from '../tokens-handler/errors.handler';
import {
  TokenWithLatestOwnerTransferFetcher,
  Token,
  TransferHistory,
  LatestOwner,
} from '../tokens-handler/interfaces/tokens.interface';

// CryptoPunks has 3 events for transfer.
// 1. Assign: This event uses to create NFT token. It is used to fetch the NFT tokens.
// 2. PunkTransfer: This event is used to record a transfer history of NFT token.
// 3. PunkBought: This event is used to record a transfer history of NFT token.
// tips: The Transfer event (similiarly in ERC721) does not have the punkIndex a.k.a tokenId.
//       So that we can't use the Transfer event to fetch the neither NFT token nor token transfer history.
export default class CryptoPunksTokenFecther
  implements TokenWithLatestOwnerTransferFetcher
{
  private ether: ethers.providers.BaseProvider;
  private readonly logger = new Logger(CryptoPunksTokenFecther.name);

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

      const { tokens, latestOwners, transferHistory } = await this.getResult(
        contractAddress,
        startBlock,
        endBlock,
      );

      this.logger.log(
        `Got ${tokens.length} tokens and ${transferHistory.length} transfer histories for contractAddress(${contractAddress}) between block(${startBlock}-${endBlock})`,
      );

      return { tokens, latestOwners, transferHistory };
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
  ) {
    const CryptoPunks_ABI = [
      'event Assign(address indexed to, uint256 punkIndex)',
      'event PunkTransfer(address indexed from, address indexed to, uint256 punkIndex);',
      'event PunkBought(uint indexed punkIndex, uint value, address indexed fromAddress, address indexed toAddress)',
    ];

    const contract = new ethers.Contract(
      contractAddress,
      CryptoPunks_ABI,
      this.ether,
    );

    const tokens = await this.getMintTokens(contract, startBlock, endBlock);

    const punkTransferHistories = await this.getPunkTransferHistory(
      contract,
      startBlock,
      endBlock,
    );

    const punkBoughtHistories = await this.getPunkBoughHistory(
      contract,
      startBlock,
      endBlock,
    );

    const allHistories = [
      ...punkTransferHistories,
      ...punkBoughtHistories,
    ].sort((a, b) => a.blockNum - b.blockNum);

    const latestOwners = this.getLatestOwners(allHistories);

    return {
      tokens,
      latestOwners,
      transferHistory: allHistories,
    };
  }

  private groupTransferHistoryByTokenId(transferHistories: TransferHistory[]) {
    const groupByTokenId = R.groupBy((history: TransferHistory) => {
      return history.cryptopunks.punkIndex as string;
    });

    const grouped = groupByTokenId(transferHistories);

    return grouped;
  }

  private async getMintTokens(
    contract: ethers.Contract,
    startBlock: number,
    endBlock: number,
  ) {
    const allMintFilter = contract.filters.Assign();

    const results = await contract.queryFilter(
      allMintFilter,
      `0x${startBlock.toString(16)}`,
      `0x${endBlock.toString(16)}`,
    );

    this.logger.log(
      `Got ${results.length} Assign events for contractAddress(${contract.address}) between block(${startBlock}-${endBlock})`,
    );

    return results.map((f) => ({
      blockNumber: f.blockNumber,
      contractAddress: f.address,
      fromAddress: ethers.constants.AddressZero,
      firstOwner: f.args['to'],
      owners: [
        {
          address: f.args['to'],
          transactionHash: f.transactionHash,
          value: 1,
        },
      ],
      toAddress: f.args['to'],
      tokenId: parseInt(f.args['punkIndex']['_hex']).toString(),
      tokenType: 'CryptoPunks',
    }));
  }

  private async getPunkTransferHistory(
    contract: ethers.Contract,
    startBlock: number,
    endBlock: number,
  ) {
    const allPunkTransferFilter = contract.filters.PunkTransfer();

    const results = await contract.queryFilter(
      allPunkTransferFilter,
      `0x${startBlock.toString(16)}`,
      `0x${endBlock.toString(16)}`,
    );

    this.logger.log(
      `Got ${results.length} PunkTransfer events for contractAddress(${contract.address}) between block(${startBlock}-${endBlock})`,
    );

    return results.map((x) => ({
      contractAddress: x.address,
      blockNum: x.blockNumber,
      hash: x.transactionHash,
      from: x.args['from'],
      to: x.args['to'],
      tokenId: parseInt(x.args['punkIndex']['_hex']).toString(),
      value: 1,
      cryptopunks: {
        punkIndex: parseInt(x.args['punkIndex']['_hex']).toString(),
      },
      category: 'CryptoPunks',
    }));
  }

  private async getPunkBoughHistory(
    contract: ethers.Contract,
    startBlock: number,
    endBlock: number,
  ) {
    const allPunkBoughtFilter = contract.filters.PunkBought();

    const results = await contract.queryFilter(
      allPunkBoughtFilter,
      `0x${startBlock.toString(16)}`,
      `0x${endBlock.toString(16)}`,
    );

    this.logger.log(
      `Got ${results.length} PunkBought events for contractAddress(${contract.address}) between block(${startBlock}-${endBlock})`,
    );

    return results.map((x) => ({
      contractAddress: x.address,
      blockNum: x.blockNumber,
      hash: x.transactionHash,
      from: x.args['fromAddress'],
      to: x.args['toAddress'],
      tokenId: parseInt(x.args['punkIndex']['_hex']).toString(),
      value: 1,
      cryptopunks: {
        punkIndex: parseInt(x.args['punkIndex']['_hex']).toString(),
      },
      category: 'CryptoPunks',
    }));
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
          tokenId: historiesWithTokenId[0].cryptopunks.punkIndex,
          blockNumber: historiesWithTokenId[0].blockNum,
        } as LatestOwner;
      },
    );
    return latestOwners;
  }
}
