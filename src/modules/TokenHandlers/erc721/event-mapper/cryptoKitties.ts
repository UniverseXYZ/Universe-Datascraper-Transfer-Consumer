import { ethers } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { TransferHistory } from '../../tokens-handler/interfaces/tokens.interface';

const abiCoder = new AbiCoder();

export const CryptoKitties_CONTRACT_ADDRESS =
  '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';

export const getTokensForCryptoKitties = async (results: ethers.Event[]) => {
  return results
    .map((f) => {
      const decodedData = abiCoder.decode(
        ['address', 'address', 'uint256'],
        f.data,
      );
      return {
        contractAddress: f.address,
        fromAddress: decodedData[0],
        toAddress: decodedData[1],
        tokenId: ethers.BigNumber.from(decodedData[2]).toString(),
        tokenType: 'ERC721',
      };
    })
    .filter((x) => x.fromAddress === ethers.constants.AddressZero);
};

export const getTransferHistoryForCryptoKitties = async (
  results: ethers.Event[],
): Promise<TransferHistory[]> => {
  return results.map((x) => {
    const decodedData = abiCoder.decode(
      ['address', 'address', 'uint256'],
      x.data,
    );
    return {
      contractAddress: x.address,
      blockNum: x.blockNumber,
      hash: x.transactionHash,
      from: decodedData[0],
      to: decodedData[1],
      tokenId: ethers.BigNumber.from(decodedData[2]).toString(),
      value: 1,
      erc721TokenId: ethers.BigNumber.from(decodedData[2]).toString(),
      category: 'ERC721',
    };
  });
};
