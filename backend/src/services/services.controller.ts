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
import { MedicalServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { assertAdminRole } from '../common/utils/doctor-scope';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: MedicalServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateServiceDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.servicesService.create(dto);
  }

  @Public()
  @Get()
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.servicesService.findAll(departmentId, activeOnly === 'true');
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    assertAdminRole(req.user);
    return this.servicesService.remove(id);
  }
}
