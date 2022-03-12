import { ethers } from 'ethers';
import { TransferHistory } from '../../tokens-handler/interfaces/tokens.interface';

export const getGenericTokens = async (results: ethers.Event[]) => {
  return results.map((f) => ({
    contractAddress: f.address,
    fromAddress: f.args['_from'],
    toAddress: f.args['_to'],
    tokenId: ethers.BigNumber.from(f.args['_tokenId']).toString(),
    tokenType: 'ERC721',
  }));
};

export const getGenericTransferHistory = async (
  results: ethers.Event[],
): Promise<TransferHistory[]> => {
  return results.map((x) => ({
    contractAddress: x.address,
    blockNum: x.blockNumber,
    logIndex: x.logIndex,
    hash: x.transactionHash,
    from: x.args['_from'],
    to: x.args['_to'],
    tokenId: ethers.BigNumber.from(x.args['_tokenId']).toString(),
    erc721TokenId: ethers.BigNumber.from(x.args['_tokenId']).toString(),
    category: 'ERC721',
  }));
};
