import { ethers } from 'ethers';
import { TransferHistory } from '../../tokens-handler/interfaces/tokens.interface';
import {
  AXIE_CONTRACT_ADDRESS,
  getTokensForAxie,
  getTransferHistoryForAxie,
} from './axie';
import {
  CryptoKitties_CONTRACT_ADDRESS,
  getTokensForCryptoKitties,
  getTransferHistoryForCryptoKitties,
} from './cryptoKitties';
import {
  CryptovoxelsParcel_CONTRACT_ADDRESS,
  getTokensForCryptovoxelsParcel,
  getTransferHistoryForCryptovoxelsParcel,
} from './cryptovoxelsParcel';
import { getGenericTokens, getGenericTransferHistory } from './generic';
import {
  getTokensForMakersTokenV2,
  getTransferHistoryForMakersTokenV2,
  MakersTokenV2_CONTRACT_ADDRESS,
} from './makersTokenV2';

export const getTokens = async (
  contractAddress: string,
  results: ethers.Event[],
) => {
  switch (contractAddress) {
    case AXIE_CONTRACT_ADDRESS:
      return getTokensForAxie(results);
    case CryptoKitties_CONTRACT_ADDRESS:
      return getTokensForCryptoKitties(results);
    case CryptovoxelsParcel_CONTRACT_ADDRESS:
      return getTokensForCryptovoxelsParcel(results);
    case MakersTokenV2_CONTRACT_ADDRESS:
      return getTokensForMakersTokenV2(results);
    default:
      return getGenericTokens(results);
  }
};

export const getTransferHistory = async (
  contractAddress: string,
  results: ethers.Event[],
): Promise<TransferHistory[]> => {
  switch (contractAddress) {
    case AXIE_CONTRACT_ADDRESS:
      return getTransferHistoryForAxie(results);
    case CryptoKitties_CONTRACT_ADDRESS:
      return getTransferHistoryForCryptoKitties(results);
    case CryptovoxelsParcel_CONTRACT_ADDRESS:
      return getTransferHistoryForCryptovoxelsParcel(results);
    case MakersTokenV2_CONTRACT_ADDRESS:
      return getTransferHistoryForMakersTokenV2(results);
    default:
      return getGenericTransferHistory(results);
  }
};
