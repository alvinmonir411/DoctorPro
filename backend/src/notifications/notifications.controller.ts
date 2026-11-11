import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  SubscribePushDto,
  UnsubscribePushDto,
  UpdateEmailConfigDto,
  TestEmailDto,
} from './dto/notification.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  assertAdminRole,
  assertNotAssistantRole,
  resolveScopedDoctorId,
} from '../common/utils/doctor-scope';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return this.notificationsService.getVapidPublicKey();
  }

  @Public()
  @Post('push/subscribe')
  subscribePush(@Body() dto: SubscribePushDto) {
    return this.notificationsService.subscribePush(dto);
  }

  @Public()
  @Post('push/unsubscribe')
  unsubscribePush(@Body() dto: UnsubscribePushDto) {
    return this.notificationsService.unsubscribePush(dto);
  }

  @Public()
  @Get('push/status')
  getPushStatus(
    @Query('endpoint') endpoint?: string,
    @Query('appointmentId') appointmentId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('serialNumber') serialNumber?: string,
  ) {
    return this.notificationsService.getPushStatus({
      endpoint,
      appointmentId,
      doctorId,
      serialNumber: serialNumber ? Number(serialNumber) : undefined,
    });
  }

  @Get('email-config')
  @UseGuards(JwtAuthGuard)
  getEmailConfig(@Req() req: any) {
    assertAdminRole(req.user);
    return this.notificationsService.getAdminEmailConfig();
  }

  @Put('email-config')
  @UseGuards(JwtAuthGuard)
  updateEmailConfig(@Body() dto: UpdateEmailConfigDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.notificationsService.updateAdminEmailConfig(dto);
  }

  @Post('test-email')
  @UseGuards(JwtAuthGuard)
  sendTestEmail(@Body() dto: TestEmailDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.notificationsService.sendTestEmail(dto.to);
  }

  @Get('my-email-config')
  @UseGuards(JwtAuthGuard)
  async getMyEmailConfig(@Req() req: any, @Query('doctorId') doctorId?: string) {
    assertNotAssistantRole(
      req.user,
      'Only doctors or clinic admins can access doctor email API settings.',
    );
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, req.user);
    const targetDoctorId = scopedDoctorId ?? doctorId;
    if (!targetDoctorId) {
      throw new BadRequestException('Doctor profile ID is required.');
    }
    return this.notificationsService.getDoctorEmailConfig(targetDoctorId);
  }

  @Put('my-email-config')
  @UseGuards(JwtAuthGuard)
  async updateMyEmailConfig(
    @Body() dto: UpdateEmailConfigDto,
    @Req() req: any,
    @Query('doctorId') doctorId?: string,
  ) {
    assertNotAssistantRole(
      req.user,
      'Only doctors or clinic admins can configure doctor email API keys.',
    );
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, req.user);
    const targetDoctorId = scopedDoctorId ?? doctorId;
    if (!targetDoctorId) {
      throw new BadRequestException('Doctor profile ID is required.');
    }
    return this.notificationsService.updateDoctorEmailConfig(targetDoctorId, dto);
  }

  @Post('my-test-email')
  @UseGuards(JwtAuthGuard)
  async sendMyTestEmail(
    @Body() dto: TestEmailDto,
    @Req() req: any,
    @Query('doctorId') doctorId?: string,
  ) {
    assertNotAssistantRole(
      req.user,
      'Only doctors or clinic admins can send test emails.',
    );
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, req.user);
    const targetDoctorId = scopedDoctorId ?? doctorId;
    if (!targetDoctorId) {
      throw new BadRequestException('Doctor profile ID is required.');
    }
    return this.notificationsService.sendDoctorTestEmail(targetDoctorId, dto.to);
  }
}
