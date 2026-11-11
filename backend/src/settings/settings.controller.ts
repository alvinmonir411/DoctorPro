import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { assertAdminRole } from '../common/utils/doctor-scope';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  findAll(@Query('group') group?: string) {
    return this.settingsService.findAll(group);
  }

  @Public()
  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put('bulk')
  @UseGuards(JwtAuthGuard)
  updateBulk(@Body() dto: BulkUpdateSettingsDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.settingsService.updateBulk(dto.settings);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard)
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.settingsService.set(key, dto.value, dto.group);
  }
}
