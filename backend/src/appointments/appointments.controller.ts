import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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

  @Post('live-queue/advance')
  @UseGuards(JwtAuthGuard)
  advanceLiveQueue(
    @Body() body: { doctorId: string; action: string; targetSerial?: number },
  ) {
    return this.appointmentsService.advanceLiveQueue(
      body.doctorId,
      body.action,
      body.targetSerial,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll({
      doctorId,
      patientId,
      status,
      date,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
