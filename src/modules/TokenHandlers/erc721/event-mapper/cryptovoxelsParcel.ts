import { ethers, utils } from 'ethers';
import { TransferHistory } from '../../tokens-handler/interfaces/tokens.interface';

export const CryptovoxelsParcel_CONTRACT_ADDRESS =
  '0x79986aF15539de2db9A5086382daEdA917A9CF0C';

export const getTokensForCryptovoxelsParcel = async (
  results: ethers.Event[],
) => {
  return results
    .filter((x) => utils.hexStripZeros(x.topics[1]) == '0x')
    .map((f) => ({
      contractAddress: f.address,
      fromAddress:
        utils.hexStripZeros(f.topics[1]) === '0x'
          ? ethers.constants.AddressZero
          : utils.getAddress(utils.hexStripZeros(f.topics[1])),
      toAddress: utils.getAddress(utils.hexStripZeros(f.topics[2])),
      tokenId: ethers.BigNumber.from(f.data).toString(),
      tokenType: 'ERC721',
    }));
};

export const getTransferHistoryForCryptovoxelsParcel = async (
  results: ethers.Event[],
): Promise<TransferHistory[]> => {
  return results.map((x) => ({
    contractAddress: x.address,
    blockNum: x.blockNumber,
    hash: x.transactionHash,
    from:
      utils.hexStripZeros(x.topics[1]) === '0x'
        ? ethers.constants.AddressZero
        : utils.getAddress(utils.hexStripZeros(x.topics[1])),
    to: utils.getAddress(utils.hexStripZeros(x.topics[2])),
    tokenId: ethers.BigNumber.from(x.data).toString(),
    value: 1,
    erc721TokenId: ethers.BigNumber.from(x.data).toString(),
    category: 'ERC721',
  }));
};
