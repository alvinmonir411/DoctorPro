import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

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
  updateBulk(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.updateBulk(dto.settings);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard)
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.set(key, dto.value, dto.group);
  }
}
