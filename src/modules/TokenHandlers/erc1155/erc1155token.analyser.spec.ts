import { Test, TestingModule } from '@nestjs/testing';
import { send } from 'process';
import ERC1155TokenAnalyser from './erc1155token.analyser';
import {
  currentOwners,
  duplicatedTransferRecords,
  firstOwner,
  newTransferRecords,
  secondRoundOwners,
  secondRoundTransfer,
  secondRoundTransferEdgeCase,
  thirdRoundOwners,
  thirdRoundTransfer,
  thirdRoundTransferEdgeCase,
} from './test-data';

describe('ERC1155Service', () => {
  let service: ERC1155TokenAnalyser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ERC1155TokenAnalyser],
    }).compile();

    service = module.get<ERC1155TokenAnalyser>(ERC1155TokenAnalyser);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildAllNewOwners should return all owners with correct value', () => {
    it('first owner transfer to second owners', () => {
      const allOwners = service.buildAllNewOwners(secondRoundTransfer);

      const firstOwners = allOwners.filter((x) => x.address === firstOwner);

      expect(firstOwners.length).toBe(4);
      for (const o of firstOwners) {
        expect(o.value).toBe(-1);
      }

      for (const o of secondRoundOwners) {
        const owner = allOwners.find((x) => x.address === o);
        expect(owner).toBeDefined();
        expect(owner.value).toBe(1);
        expect(owner.transactionHash).toBeDefined();
      }
    });

    it('two rounds transfer owners ', () => {
      const allOwners = service.buildAllNewOwners([
        ...secondRoundTransfer,
        ...thirdRoundTransfer,
      ]);

      const firstOwners = allOwners.filter((x) => x.address === firstOwner);

      expect(firstOwners.length).toBe(4);
      for (const o of firstOwners) {
        expect(o.value).toBe(-1);
      }

      // second round owner should have 0 value as their values have been transfered to third round owners
      for (const o of secondRoundOwners) {
        const ownerRecords = allOwners.filter((x) => x.address === o);
        expect(ownerRecords.length).toBe(2);
        const value = ownerRecords.reduce((acc, x) => acc + x.value, 0);
        expect(value).toBe(0);
      }

      for (const o of thirdRoundOwners) {
        const owner = allOwners.find((x) => x.address === o);
        expect(owner).toBeDefined();
        expect(owner.value).toBe(1);
        expect(owner.transactionHash).toBeDefined();
      }
    });
  });

  describe('filterOwnersForToken should return correct owners', () => {
    it('first owner transfer to second owners', () => {
      const allOwners = service.buildAllNewOwners(secondRoundTransfer);
      const filteredOwners = service.filterOwnersForToken(allOwners);

      expect(filteredOwners.length).toBe(5);

      expect(filteredOwners.find((x) => x.address === firstOwner).value).toBe(-4);

      for (const o of secondRoundOwners) {
        const owner = allOwners.find((x) => x.address === o);
        expect(owner).toBeDefined();
        expect(owner.value).toBe(1);
        expect(owner.transactionHash).toBeDefined();
      }
    });

    it('second owners transfer to third round owners', () => {
      const allOwners = service.buildAllNewOwners([
        ...secondRoundTransfer,
        ...thirdRoundTransfer,
      ]);
      const filteredOwners = service.filterOwnersForToken(allOwners);

      expect(filteredOwners.length).toBe(9);

      expect(filteredOwners.find((x) => x.address === firstOwner).value).toBe(-4);

      // second round owner should have 0 value as their values have been transfered to third round owners
      for (const o of secondRoundOwners) {
        const ownerRecords = allOwners.filter((x) => x.address === o);
        expect(ownerRecords.length).toBe(2);
        const value = ownerRecords.reduce((acc, x) => acc + x.value, 0);
        expect(value).toBe(0);
      }

      for (const o of thirdRoundOwners) {
        const owner = allOwners.find((x) => x.address === o);
        expect(owner).toBeDefined();
        expect(owner.value).toBe(1);
        expect(owner.transactionHash).toBeDefined();
      }
    });

    it('edge case: transfer partial values', () => {
      const allOwners = service.buildAllNewOwners([
        ...secondRoundTransferEdgeCase,
        ...thirdRoundTransferEdgeCase,
      ]);
      const filteredOwners = service.filterOwnersForToken(allOwners).filter(x => x.value > 0);

      expect(filteredOwners.length).toBe(4);

      expect(filteredOwners.find((x) => x.address === secondRoundOwners[0]).value).toBe(1);
      expect(filteredOwners.find((x) => x.address === secondRoundOwners[1]).value).toBe(1);
      expect(filteredOwners.find((x) => x.address === thirdRoundOwners[0]).value).toBe(4);
      expect(filteredOwners.find((x) => x.address === thirdRoundOwners[1]).value).toBe(1);
    });
  });

  describe('buildOwnersForExistingOwners', () => {
    it('should return correct owners', () => {
      const newOwners = service
        .buildOwnersForExistingOwners(currentOwners, newTransferRecords);

      expect(newOwners.length).toBe(3);

      expect(newOwners.find((x) => x.address === secondRoundOwners[2]).value).toBe(1);
      expect(newOwners.find((x) => x.address === thirdRoundOwners[0]).value).toBe(1);
      expect(newOwners.find((x) => x.address === thirdRoundOwners[1]).value).toBe(1);
    });

    it('should return current owner if check txn hash are existing', () => {
      const newOwners = service
        .buildOwnersForExistingOwners(currentOwners, duplicatedTransferRecords);

      expect(newOwners.length).toBe(3);
      expect(newOwners).toEqual(currentOwners);
    });
  })
});
