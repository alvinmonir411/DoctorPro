import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-appointments')
  getRecentAppointments(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentAppointments(limit ? parseInt(limit, 10) : 10);
  }

  @Get('upcoming-appointments')
  getUpcomingAppointments(@Query('limit') limit?: string) {
    return this.dashboardService.getUpcomingAppointments(limit ? parseInt(limit, 10) : 10);
  }
}
