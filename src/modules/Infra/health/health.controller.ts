import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { EthHealthIndicator } from '../eth-health/eth-health.service';
import { DbHealthService } from '../db-health/db-health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DbHealthService,
    private eth: EthHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async health_check() {
    return this.health.check([
      () => this.db.pingCheck('mongodb'),
    ]);
  }
}
