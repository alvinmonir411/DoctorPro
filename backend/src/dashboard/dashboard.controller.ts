import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Req() req: any) {
    return this.dashboardService.getStats(req.user);
  }

  @Get('recent-appointments')
  getRecentAppointments(@Query('limit') limit: string | undefined, @Req() req: any) {
    return this.dashboardService.getRecentAppointments(
      limit ? parseInt(limit, 10) : 10,
      req.user,
    );
  }

  @Get('upcoming-appointments')
  getUpcomingAppointments(@Query('limit') limit: string | undefined, @Req() req: any) {
    return this.dashboardService.getUpcomingAppointments(
      limit ? parseInt(limit, 10) : 10,
      req.user,
    );
  }
}
