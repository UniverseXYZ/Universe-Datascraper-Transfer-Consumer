import {
  TransferHistoryError,
  SizeExceedError,
} from './interfaces/tokens.interface';

export function handleSizeExceed(error: any) {
  if (error.body) {
    //infura and alchemy does this way
    const errorBody = JSON.parse(error.body);
    const transferHistoryError = errorBody.error as TransferHistoryError;
    if (
      transferHistoryError.message.includes('size exceeded') ||
      transferHistoryError.message.includes('more than 10000 results')
    ) {
      throw new SizeExceedError('please split the block size');
    }
  }
  if (error.message && error.message.includes('failed to meet quorum')) {
    //infura does this if requested block range is too big.
    throw new SizeExceedError('please split the block size');
  }
}
