import { Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import R from 'ramda';
import { EthereumService } from 'src/modules/Infra/ethereum/ethereum.service';
import { handleSizeExceedError } from '../tokens-handler/errors.handler';
import {
  Token,
  TransferHistory,
  TokenTransferFetcher,
} from '../tokens-handler/interfaces/tokens.interface';

// CryptoPunks has 3 events for transfer.
// 1. Assign: This event uses to create NFT token. It is used to fetch the NFT tokens.
// 2. PunkTransfer: This event is used to record a transfer history of NFT token.
// 3. PunkBought: This event is used to record a transfer history of NFT token.
// tips: The Transfer event (similiarly in ERC721) does not have the punkIndex a.k.a tokenId.
//       So that we can't use the Transfer event to fetch the neither NFT token nor token transfer history.
export default class CryptoPunksTokenFecther implements TokenTransferFetcher {
  private ether: ethers.providers.BaseProvider;
  private readonly logger = new Logger(CryptoPunksTokenFecther.name);

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

      const { tokens, transferHistory } = await this.getResult(
        contractAddress,
        startBlock,
        endBlock,
      );

      this.logger.log(
        `Got ${tokens.length} tokens and ${transferHistory.length} transfer histories for contractAddress(${contractAddress}) between block(${startBlock}-${endBlock})`,
      );

      return { tokens, transferHistory };
    } catch (error) {
      console.log(error);
      if (error?.error?.reason === 'timeout' || error?.error?.code === 429 || error?.error?.status === 403 || error?.error?.code === 'TIMEOUT') {
        return await this.ethereumService.connectToProvider(() => this.getTokensAndTransferHistory(contractAddress, startBlock, endBlock));
      }

      this.logger.log(`Error when getting transfer history - ${error}`);
      handleSizeExceedError(error);
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

    const mintHistory = await this.getMintTokensHistory(
      contract,
      startBlock,
      endBlock,
    );

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
      ...mintHistory,
      ...punkTransferHistories,
      ...punkBoughtHistories,
    ].sort((a, b) => a.blockNum - b.blockNum);

    const tokens = this.mapTokens(allHistories);

    return {
      tokens,
      transferHistory: allHistories,
    };
  }

  private mapTokens(allHistories: TransferHistory[]) {
    const tokens = [...new Map(allHistories.map(history =>
      [history['tokenId'], history])).values()]
      .map(
        (history) => ({
          blockNumber: history.blockNum,
          contractAddress: history.contractAddress,
          tokenId: history.tokenId,
          tokenType: history.category,
          value: 1,
        }),
    );

    return tokens;
  }

  private async getMintTokensHistory(
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
      blockNum: f.blockNumber,
      contractAddress: f.address,
      from: ethers.constants.AddressZero,
      firstOwner: f.args['to'],
      to: f.args['to'],
      tokenId: ethers.BigNumber.from(f.args['punkIndex']).toString(),
      cryptopunks: {
        punkIndex: ethers.BigNumber.from(f.args['punkIndex']).toString(),
      },
      category: 'CryptoPunks',
      hash: f.transactionHash,
      logIndex: f.logIndex,
      value: 1,
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
      logIndex: x.logIndex,
      from: x.args['from'],
      to: x.args['to'],
      tokenId: ethers.BigNumber.from(x.args['punkIndex']).toString(),
      value: 1,
      cryptopunks: {
        punkIndex: ethers.BigNumber.from(x.args['punkIndex']).toString(),
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
      logIndex: x.logIndex,
      from: x.args['fromAddress'],
      to: x.args['toAddress'],
      tokenId: ethers.BigNumber.from(x.args['punkIndex']).toString(),
      value: 1,
      cryptopunks: {
        punkIndex: ethers.BigNumber.from(x.args['punkIndex']).toString(),
      },
      category: 'CryptoPunks',
    }));
  }
}
