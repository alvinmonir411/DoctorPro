import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import {
  BookPublicAppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Public()
  @Post('book')
  bookPublic(@Body() dto: BookPublicAppointmentDto) {
    return this.appointmentsService.bookPublic(dto);
  }

  @Public()
  @Get('available-slots')
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(doctorId, date);
  }

  @Public()
  @Get('live-queue')
  getLiveQueue(
    @Query('doctorId') doctorId?: string,
    @Query('appointmentId') appointmentId?: string,
    @Query('phone') phone?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.getLiveQueue({
      doctorId,
      appointmentId,
      phone,
      date,
    });
  }

  @Get('live-queue/manage')
  @UseGuards(JwtAuthGuard)
  getManageLiveQueue(@Query('doctorId') doctorId?: string, @Req() req?: any) {
    return this.appointmentsService.getManageLiveQueue(doctorId, req?.user);
  }

  @Post('live-queue/advance')
  @UseGuards(JwtAuthGuard)
  advanceLiveQueue(
    @Body() body: { doctorId: string; action: string; targetSerial?: number },
    @Req() req: any,
  ) {
    return this.appointmentsService.advanceLiveQueue(
      body.doctorId,
      body.action,
      body.targetSerial,
      req.user,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    return this.appointmentsService.create(dto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Req() req: any,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll(
      {
        doctorId,
        patientId,
        status,
        date,
        startDate,
        endDate,
      },
      req.user,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.appointmentsService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @Req() req: any) {
    return this.appointmentsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.appointmentsService.remove(id, req.user);
  }
}
