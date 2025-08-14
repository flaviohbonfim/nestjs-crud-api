import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { HealthService } from './health.service';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('healthz')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application and database health' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application and database are healthy.' })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'Database connection failed.' })
  async getHealth(@Res() res: Response) {
    const dbHealthy = await this.healthService.checkDatabaseConnection();

    if (dbHealthy) {
      return res.status(HttpStatus.OK).json({ status: 'ok', database: 'connected' });
    } else {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ status: 'error', database: 'disconnected' });
    }
  }
}
