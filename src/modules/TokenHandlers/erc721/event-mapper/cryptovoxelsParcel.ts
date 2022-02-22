import { ethers, utils } from 'ethers';
import { decodeAddress } from 'src/utils/abiCoder';
import { TransferHistory } from '../../tokens-handler/interfaces/tokens.interface';

export const CryptovoxelsParcel_CONTRACT_ADDRESS =
  '0x79986aF15539de2db9A5086382daEdA917A9CF0C';

export const getTokensForCryptovoxelsParcel = async (
  results: ethers.Event[],
) => {
  return results
    .filter((x) => decodeAddress(x.topics[1]) === ethers.constants.AddressZero)
    .map((f) => ({
      contractAddress: f.address,
      fromAddress: decodeAddress(f.topics[1]),
      toAddress: decodeAddress(f.topics[2]),
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
    from: decodeAddress(x.topics[1]),
    to: decodeAddress(x.topics[2]),
    tokenId: ethers.BigNumber.from(x.data).toString(),
    value: 1,
    erc721TokenId: ethers.BigNumber.from(x.data).toString(),
    category: 'ERC721',
  }));
};
