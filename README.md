# Universe Datascraper Transfer Consumer

## Description

This consumer is to fetch transfer events by given a token type, a NFT contract address and a block range, which are passed from Block Producer via SQS. This analyses the events to extract NFT tokens and their transfer histories, which are stored in database. 


## Requirements:

- NodeJS version 14+
- NPM

## Required External Service

- AWS SQS
- Infura
- MongoDB

## Primary Third Party Libraries

- NestJS
- Mongoose (MongoDB)
- bbc/sqs-producer (Only applicable for producers)
- bbc/sqs-consumer (Only applicable for consumers)

## DataFlow

### Input Data

The transfer producer sends the messages that contain below parameters to this consumer. 
- Token type (Current supported): ERC721, ERC1155, CryptoPunks
- NFT contract address
- Block range: start block - end block


### Data Analysis and Storage

Depends on the token type, this consumer scans and extracts the first token that minted in different way. And it fetches the transfer histories by a given block range. 


### Output

After fetching and analysing the data from blockchain, it stores the NFT token and transfer histories respectively. 

- NFT token
- Transfer History

## MongoDB Collection Usage

This consumer leverage the following data collection in [schema](https://github.com/plugblockchain/Universe-Datascraper-Schema)
- NFT Collection Task: set task status in processing, split or error. 
- NFT Tokens: store extracted NFT tokens.
- NFT Transfer Histories: store extracted NFT transfer histories.