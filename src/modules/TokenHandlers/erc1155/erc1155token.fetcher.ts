import { Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import EthereumService from 'src/modules/infra/ethereum/ethereum.service';
import { SizeExceedError } from 'src/modules/infra/ethereum/ethereum.types';
import {
  TokenFetcher,
  Token,
  TransferHistory,
  TransferHistoryError,
} from 'src/modules/infra/ethereum/interface';

// This handler is only for Opensea ERC1155 token at the moment
export default class ERC1155TokenFetcher implements TokenFetcher {
  private ether: ethers.providers.BaseProvider;
  private readonly logger = new Logger(ERC1155TokenFetcher.name);

  constructor(private readonly ethereumService: EthereumService) {
    this.ether = this.ethereumService.ether;
  }

  async getTokensAndTransferHistory(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<{
    tokens: Token[];
    transferHistory: TransferHistory[];
  }> {
    try {
      this.logger.log(
        `Start to get contractAddress(${contractAddress}) in block(${startBlock}-${endBlock})'s transfer history`,
      );

      const result = await this.getResult(
        contractAddress,
        startBlock,
        endBlock,
      );

      this.logger.log(
        `Got ${result.tokens.length} tokens and ${result.transferHistory.length} transfer histories.`,
      );

      return result;
    } catch (error) {
      console.log(error);
      this.logger.log(`Error when getting transfer history - ${error}`);
      this.handleSizeExceed(error);
    }
  }

  private async getResult(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<{
    tokens: Token[];
    transferHistory: TransferHistory[];
  }> {
    const singleResults = this.getSingleTransfers(
      contractAddress,
      startBlock,
      endBlock,
    );

    const batchResults = this.getBatchTransfers(
      contractAddress,
      startBlock,
      endBlock,
    );

    const allResults = await Promise.all([singleResults, batchResults]);

    const singleTransferHistory = this.getSingleTransferHistory(allResults[0]);
    const singleTransferTokens = this.getSingleTransferTokens(allResults[0]);
    const batchTransferHistory = this.getBatchTransferHistory(allResults[1]);
    const batchTransferTokens = this.getBatchTransferTokens(allResults[1]);

    return {
      tokens: [...singleTransferTokens, ...batchTransferTokens],
      transferHistory: [...singleTransferHistory, ...batchTransferHistory],
    };
  }

  private async getSingleTransfers(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<ethers.Event[]> {
    const ERC1155_TransferSingle_ABI = [
      'event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)',
      // 'event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values)',
    ];

    const contract = new ethers.Contract(
      contractAddress,
      ERC1155_TransferSingle_ABI,
      this.ether,
    );

    const allTransferFilter = contract.filters.TransferSingle();
    const results = await contract.queryFilter(
      allTransferFilter,
      `0x${startBlock.toString(16)}`,
      `0x${endBlock.toString(16)}`,
    );
    this.logger.log(
      `Got ${results.length} single transfer events for contractAddress(${contractAddress}) between block(${startBlock}-${endBlock})`,
    );
    return results;
  }

  private async getBatchTransfers(
    contractAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<ethers.Event[]> {
    const ERC1155_TransferBatch_ABI = [
      'event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values)',
    ];

    const contract = new ethers.Contract(
      contractAddress,
      ERC1155_TransferBatch_ABI,
      this.ether,
    );

    const allTransferFilter = contract.filters.TransferBatch();
    const results = await contract.queryFilter(
      allTransferFilter,
      `0x${startBlock.toString(16)}`,
      `0x${endBlock.toString(16)}`,
    );

    this.logger.log(
      `Got ${results.length} batch transfer events for contractAddress(${contractAddress}) between block(${startBlock}-${endBlock})`,
    );
    return results;
  }

  private getSingleTransferTokens(results: ethers.Event[]) {
    return results
      .map((f) => ({
        contractAddress: f.address,
        blockNumber: f.blockNumber,
        transactionHash: f.transactionHash,
        fromAddress: f.args['_from'],
        firstOwner: f.args['_from'], //at very beginning, the first from address is the first owner
        toAddress: f.args['_to'],
        tokenId: ethers.BigNumber.from(f.args['_id']).toString(),
        value: ethers.BigNumber.from(f.args['_value']).toNumber(),
        tokenType: 'ERC1155',
      }))
      .map((r) => {
        if (r.fromAddress === ethers.constants.AddressZero) {
          return {
            ...r,
            firstOwner: r.toAddress,
          };
        }

        return r;
      });
  }

  private getSingleTransferHistory(results: ethers.Event[]): TransferHistory[] {
    return results.map((x) => ({
      contractAddress: x.address,
      blockNum: x.blockNumber,
      hash: x.transactionHash,
      from: x.args['_from'],
      to: x.args['_to'],
      erc1155Metadata: {
        tokenId: ethers.BigNumber.from(x.args['_id']).toString(),
        value: ethers.BigNumber.from(x.args['_value']).toNumber(),
      },
      category: 'ERC1155',
    }));
  }

  private getBatchTransferTokens(results: ethers.Event[]) {
    return results.flatMap((f) =>
      f.args['_ids']
        .map((id, index) => ({
          contractAddress: f.address,
          blockNumber: f.blockNumber,
          transactionHash: f.transactionHash,
          fromAddress: f.args['_from'],
          firstOwner: f.args['_from'], //at very beginning, the first from address is the first owner
          toAddress: f.args['_to'],
          tokenId: ethers.BigNumber.from(id).toString(),
          value: ethers.BigNumber.from(f.args['_values'][index]).toNumber(),
          tokenType: 'ERC1155',
        }))
        .map((r) => {
          if (r.fromAddress === ethers.constants.AddressZero) {
            return {
              ...r,
              firstOwner: r.toAddress,
            };
          }

          return r;
        }),
    );
  }

  private getBatchTransferHistory(results: ethers.Event[]): TransferHistory[] {
    return results.flatMap((x) =>
      x.args['_ids'].map((id, index) => ({
        contractAddress: x.address,
        blockNum: x.blockNumber,
        hash: x.transactionHash,
        from: x.args['_from'],
        to: x.args['_to'],
        erc1155Metadata: {
          tokenId: ethers.BigNumber.from(id).toString(),
          value: ethers.BigNumber.from(x.args['_values'][index]).toNumber(),
        },
        category: 'ERC1155',
      })),
    );
  }

  private handleSizeExceed(error: any) {
    if (error.body) {
      //infura and alchemy does this way
      const errorBody = JSON.parse(error.body);
      const transferHistoryError = errorBody.error as TransferHistoryError;
      if (
        transferHistoryError.message.includes('size exceeded') ||
        transferHistoryError.message.includes('more than 10000 results')
      ) {
        throw new SizeExceedError('please split the block size');
      }
    }
    if (error.message && error.message.includes('failed to meet quorum')) {
      //infura does this if requested block range is too big.
      throw new SizeExceedError('please split the block size');
    }
  }
}
