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
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertAdminRole } from '../common/utils/doctor-scope';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() dto: CreatePatientDto, @Req() req: any) {
    assertAdminRole(req.user, 'Only clinic administrators can manually add patients.');
    return this.patientsService.create(dto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.patientsService.findAll({ search, date, status }, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.patientsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @Req() req: any) {
    return this.patientsService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.patientsService.remove(id, req.user);
  }
}
