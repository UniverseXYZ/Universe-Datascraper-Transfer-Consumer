import { NFTTokenOwner } from 'datascraper-schema';
import R from 'ramda';
import { CreateNFTTokenOwnerDto } from 'src/modules/Dal/dal-nft-token-owner/dto/create-nft-token-owner.dto';
import { TransferHistory } from './interfaces/tokens.interface';

// ERC721 or CryptoPunks' owners operations
export const calculateOwners = (
  latestHistory: TransferHistory[],
  owners: NFTTokenOwner[],
) => {
  const toBeInsertedOwners = [] as CreateNFTTokenOwnerDto[];
  const toBeUpdatedOwners = [] as CreateNFTTokenOwnerDto[];

  for (const history of latestHistory) {
    const { tokenId, contractAddress, to, blockNum, logIndex, category } =
      history;

    const owner = owners.find(
      (x) => x.tokenId === tokenId && x.contractAddress === contractAddress,
    );

    const newOwner = {
      tokenId,
      contractAddress,
      address: to,
      blockNum,
      logIndex,
      tokenType: category,
      transactionHash: history.hash,
      value: '1',
    };

    if (!owner) {
      addNewOwner(toBeInsertedOwners, newOwner);
      continue;
    }
    if (owner.blockNum > blockNum) continue;

    if (owner.blockNum === blockNum && owner.logIndex > logIndex) continue;

    toBeUpdatedOwners.push(newOwner);
  }

  return { toBeInsertedOwners, toBeUpdatedOwners };
};

const addNewOwner = (
  toBeInsertedOwners: CreateNFTTokenOwnerDto[],
  newOwner: CreateNFTTokenOwnerDto,
) => {
  const existingOwnerIndex = toBeInsertedOwners.findIndex(
    (x) =>
      x.contractAddress === newOwner.contractAddress &&
      x.tokenId === newOwner.tokenId,
  );

  if (existingOwnerIndex < 0) {
    toBeInsertedOwners.push(newOwner);
    return;
  }

  const existingOwner = toBeInsertedOwners[existingOwnerIndex];

  if (
    existingOwner.blockNum <= newOwner.blockNum &&
    existingOwner.logIndex < newOwner.logIndex
  ) {
    toBeInsertedOwners[existingOwnerIndex] = newOwner;
  }
};

export const getLatestHistory = (transferHistories: TransferHistory[]) => {
  const groupedTransferHistories =
    groupTransferHistoryByTokenId(transferHistories);

  const latestTransferHistory = Object.keys(groupedTransferHistories).map(
    (tokenId) => {
      // sort descending
      const historiesWithTokenId = groupedTransferHistories[tokenId].sort(
        (a, b) => b.blockNum - a.blockNum,
      );

      return historiesWithTokenId[0];
    },
  );
  return latestTransferHistory;
};

const groupTransferHistoryByTokenId = (
  transferHistories: TransferHistory[],
) => {
  const groupByTokenId = R.groupBy((history: TransferHistory) => {
    return history.tokenId;
  });

  const grouped = groupByTokenId(transferHistories);

  return grouped;
};
