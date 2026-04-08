import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService, type DashboardStats } from './analytics.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';

@ApiTags('Analytics')
@ApiBearerAuth('JWT')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get dashboard summary stats' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  @Get('stats')
  getStats(): Promise<DashboardStats> {
    return this.analyticsService.getStats();
  }
}
