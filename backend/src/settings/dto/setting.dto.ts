import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateSettingDto {
  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  group?: string;
}

export class SettingItemDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  group?: string;
}

export class BulkUpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings: SettingItemDto[];
}
