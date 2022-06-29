import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import EthereumService from '../ethereum/ethereum.service';
import R from 'ramda';

@Injectable()
export class EthHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(EthereumService.name);

  constructor(private ethService: EthereumService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const { ether } = this.ethService;
    const blockNumber = await ether.getBlockNumber();
    const network = await ether.getNetwork();
    const isHealthy = !R.isNil(blockNumber);
    const result = this.getStatus(key, isHealthy, { blockNumber, network });

    if (isHealthy) {
      this.logger.log('Health check succeeded.');
      return result;
    }

    this.logger.error('Health check failed.');
    throw new HealthCheckError(
      'infura health check failed',
      'block number is null or undefined',
    );
  }
}
