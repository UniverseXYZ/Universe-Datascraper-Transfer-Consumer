import { ethers } from 'ethers';
import { decodeAddress } from 'src/utils/abiCoder';
import { TransferHistory } from '../../tokens-handler/interfaces/tokens.interface';

export const AXIE_CONTRACT_ADDRESS =
  '0xF5b0A3eFB8e8E4c201e2A935F110eAaF3FFEcb8d';

export const getTokensForAxie = async (results: ethers.Event[]) => {
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

export const getTransferHistoryForAxie = async (
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
