import { Logger } from '@nestjs/common';
import { groupBy } from 'ramda';
import { CreateNFTTokenDto } from 'src/modules/Dal/dal-nft-token/dto/create-nft-token.dto';
import { DalNFTTokensService } from 'src/modules/Dal/dal-nft-token/dal-nft-token.service';
import {
  NFTToken,
  Owner,
} from 'src/modules/DAL/dal-nft-token/schemas/nft-token.schema';

export default class ERC1155TokenAnalyser {
  private readonly logger = new Logger(ERC1155TokenAnalyser.name);

  constructor(private readonly nftTokensService: DalNFTTokensService) {}

  async handleUpcomingTokens(tokens: CreateNFTTokenDto[]) {
    this.logger.log(`Handle upcoming ${tokens.length} ERC1155 tokens`);
    const { toBeInsertedTokens, toBeUpdatedTokens } =
      await this.analyseUpcomingTokens(tokens);

    this.logger.log(`Insert ${toBeInsertedTokens.length} ERC1155 tokens`);
    await this.nftTokensService.insertTokens(toBeInsertedTokens);
    this.logger.log(`Update ${toBeUpdatedTokens.length} ERC1155 tokens`);
    await this.nftTokensService.updateTokens(toBeUpdatedTokens);
  }

  async analyseUpcomingTokens(tokens: CreateNFTTokenDto[]) {
    //query all the tokens that have the same contract address and tokenId
    const existingTokens =
      await this.nftTokensService.getExistingTokensByContractAddressAndTokenId(
        tokens,
      );

    const groupedTokensByContractAndTokenId =
      this.groupTokensByContractAddressAndTokenId(tokens);
    const toBeInsertedTokens: CreateNFTTokenDto[] = [];
    const toBeUpdatedTokens: CreateNFTTokenDto[] = [];

    for (const [key, groupedTokens] of Object.entries(
      groupedTokensByContractAndTokenId,
    )) {
      // check if the token already exists
      // key is formatted as 'contractAddress-tokenId'
      const existingToken = existingTokens.find(
        (x) => `${x.contractAddress}-${x.tokenId}` === key,
      );
      if (existingToken) {
        // need to update the owners, combine the existing owners with the new owners
        toBeUpdatedTokens.push(
          this.buildToBeUpdatedToken(existingToken, groupedTokens),
        );
      } else {
        //    else
        //      need to insert the token
        if (groupedTokens.length === 1) {
          // if there is only one token, this is a new token
          toBeInsertedTokens.push({
            ...groupedTokens[0],
            owners: [this.buildNewOwner(groupedTokens[0])],
          });
        } else {
          toBeInsertedTokens.push(this.buildToBeInsertedToken(groupedTokens));
        }
      }
    }
    return {
      toBeInsertedTokens,
      toBeUpdatedTokens,
    };
  }

  private buildToBeInsertedToken(groupedTokens: CreateNFTTokenDto[]) {
    //sort the list by blockNumber, as the very first one can be the first onwer
    const sortedTokens = groupedTokens.sort(
      (a, b) => a.blockNumber - b.blockNumber,
    );

    const firstToken = sortedTokens[0];

    const allOwners = this.buildAllNewOwners(sortedTokens);
    const toBeInsertedToken = {
      ...firstToken,
      owners: this.filterOwnersForToken(allOwners).filter((x) => x.value > 0),
    };
    return toBeInsertedToken;
  }

  private buildToBeUpdatedToken(
    existingToken: NFTToken,
    groupedTokens: CreateNFTTokenDto[],
  ) {
    const { contractAddress, tokenId, firstOwner, tokenType } = existingToken;
    const addedOwnersExistingToken = {
      contractAddress,
      tokenId,
      firstOwner,
      tokenType,
      owners: this.buildOwnersForExistingOwners(
        existingToken.owners,
        groupedTokens,
      ) as Owner[],
    };
    return addedOwnersExistingToken;
  }

  buildAllNewOwners(groupedTokens: CreateNFTTokenDto[]) {
    const previousOwners = groupedTokens.map((x) => ({
      address: x.fromAddress,
      value: -x.value,
      transactionHash: x.transactionHash,
    }));

    const currectOwners = groupedTokens.map((x) => ({
      address: x.toAddress,
      value: +x.value,
      transactionHash: x.transactionHash,
    }));

    return [...previousOwners, ...currectOwners];
  }

  filterOwnersForToken(allOwners: Owner[] = []): Owner[] {
    const groupByAddress = groupBy((x: any) => x.address);

    const groupedOwners = groupByAddress(allOwners);

    const allOwnerAddresses = Object.keys(groupedOwners);

    const newOwners = [];

    for (const address of allOwnerAddresses) {
      const owners = groupedOwners[address];
      const totalValue = owners.reduce((acc, x) => acc + x.value, 0);

      newOwners.push({
        address,
        value: totalValue,
        transactionHash: owners[0].transactionHash,
      });
    }

    return newOwners;
  }

  buildOwnersForExistingOwners(
    currentOwners: Owner[],
    tokens: CreateNFTTokenDto[],
  ): Owner[] {
    // filter out all existing hash, remove duplication
    const filteredTokens = tokens.filter(
      (x) =>
        !currentOwners.find((y) => y.transactionHash === x.transactionHash),
    );

    //no new transactions
    if (filteredTokens.length === 0) {
      return currentOwners;
    }

    const newOwners = this.buildAllNewOwners(filteredTokens);
    const allOwners = [...currentOwners, ...newOwners];
    const owners = this.filterOwnersForToken(allOwners).filter(
      (x) => x.value > 0,
    );
    return owners;
  }

  groupTokensByContractAddressAndTokenId(tokens: CreateNFTTokenDto[]) {
    const groupByContractAddressAndTokenId = groupBy(
      (x: CreateNFTTokenDto) => `${x.contractAddress}-${x.tokenId}`,
    );

    const groupedTokensByContractAndTokenId =
      groupByContractAddressAndTokenId(tokens);

    return groupedTokensByContractAndTokenId;
  }

  buildNewOwner(x: CreateNFTTokenDto) {
    return {
      address: x.toAddress,
      value: x.value,
      transactionHash: x.transactionHash,
    };
  }
}
