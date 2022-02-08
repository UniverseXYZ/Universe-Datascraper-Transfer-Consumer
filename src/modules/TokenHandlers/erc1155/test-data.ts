export const contractAddress = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
export const tokenId =
  '96465815520581529533564524644845236686987683307595492527165374397274596048906';
export const firstOwner = '0xd545b77A99A62253B533934dc7EBe311915897f0';

export const secondRoundOwners = [
  '0x1b9c993F2962d8F0FAEa3387b368A011f2B9D0EE',
  '0x669E2535D1D4482C67b327e06E9943afA05728CA',
  '0x5c5fE8092C827f9C72b85D59C79B1555F5caf080',
  '0xf8BbDAcf8f81628fd83dA4fFD80821A3dD038314',
];

export const secondRoundTransfer = [
  {
    contractAddress,
    blockNumber: 14095921,
    transactionHash:
      '0xc7b8bbcedf1f93cc74c252ec311de359ba413b1f65bea6f4bfccaa854d445e81',
    fromAddress: firstOwner,
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: secondRoundOwners[0],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095923,
    transactionHash:
      '0x75b7887094035d47c274ee86f7a4200a04ecbd3c374a52424e1e28705e783efc',
    fromAddress: firstOwner,
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: secondRoundOwners[1],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095924,
    transactionHash:
      '0x75b7887094035d47c274ee86f7a4200a04ecbd3c374a52424e1e28705e783efd',
    fromAddress: firstOwner,
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: secondRoundOwners[2],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095925,
    transactionHash:
      '0x75b7887094035d47c274ee86f7a4200a04ecbd3c374aa2424e1e28705e783efe',
    fromAddress: firstOwner,
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: secondRoundOwners[3],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
];

export const thirdRoundOwners = [
  '0x1b9c993F2962d8F0FAEa3387b368A011f2B9D0EF',
  '0x669E2535D1D4482C67b327e06E9943afA05728CB',
  '0x5c5fE8092C827f9C72b85D59C79B1555F5caf081',
  '0xf8BbDAcf8f81628fd83dA4fFD80821A3dD038315',
];

export const thirdRoundTransfer = [
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda3f',
    fromAddress: secondRoundOwners[0],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[0],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda40',
    fromAddress: secondRoundOwners[1],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[1],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095928,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda50',
    fromAddress: secondRoundOwners[2],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[2],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095929,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda60',
    fromAddress: secondRoundOwners[3],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[3],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
];

export const secondRoundTransferEdgeCase = [
  {
    contractAddress,
    blockNumber: 14095921,
    transactionHash:
      '0xc7b8bbcedf1f93cc74c252ec311de359ba413b1f65bea6f4bfccaa854d445e81',
    fromAddress: firstOwner,
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: secondRoundOwners[0],
    tokenId,
    value: 5,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095923,
    transactionHash:
      '0x75b7887094035d47c274ee86f7a4200a04ecbd3c374a52424e1e28705e783efc',
    fromAddress: firstOwner,
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: secondRoundOwners[1],
    tokenId,
    value: 2,
    tokenType: 'ERC1155',
  },
];

export const thirdRoundTransferEdgeCase = [
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda3f',
    fromAddress: secondRoundOwners[0],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[0],
    tokenId,
    value: 4,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda40',
    fromAddress: secondRoundOwners[1],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[1],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
];

export const currentOwners = [
  {
    address: secondRoundOwners[0],
    value: 1,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdd111',
  },
  {
    address: secondRoundOwners[1],
    value: 1,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdd112',
  },
  {
    address: secondRoundOwners[2],
    value: 1,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdd113',
  },
];

export const duplicatedTransferRecords = [
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdd111',
    fromAddress: secondRoundOwners[0],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[0],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdd112',
    fromAddress: secondRoundOwners[1],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[1],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdd113',
    fromAddress: secondRoundOwners[2],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[2],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
];

export const newTransferRecords = [
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda3f',
    fromAddress: secondRoundOwners[0],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[0],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
  {
    contractAddress,
    blockNumber: 14095927,
    transactionHash:
      '0xa731104a83a61a895ba00d90353012946963837ca63855d673933ffc00fdda40',
    fromAddress: secondRoundOwners[1],
    // firstOwner: '0xd545b77A99A62253B533934dc7EBe311915897f0',
    toAddress: thirdRoundOwners[1],
    tokenId,
    value: 1,
    tokenType: 'ERC1155',
  },
];
