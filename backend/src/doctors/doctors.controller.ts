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
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { assertAdminRole } from '../common/utils/doctor-scope';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDoctorDto, @Req() req: any) {
    assertAdminRole(req.user, 'Only clinic administrators can add new doctors.');
    return this.doctorsService.create(dto);
  }

  @Get('my-profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Req() req: any) {
    return this.doctorsService.findMyProfile(req.user);
  }

  @Public()
  @Get()
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('specialization') specialization?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('topRated') topRated?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.doctorsService.findAll({
      departmentId,
      specialization,
      search,
      activeOnly: activeOnly === 'true',
      topRated: topRated === 'true',
      sortBy,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @Req() req: any) {
    return this.doctorsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    assertAdminRole(req.user, 'Only clinic administrators can delete doctors.');
    return this.doctorsService.remove(id);
  }
}
