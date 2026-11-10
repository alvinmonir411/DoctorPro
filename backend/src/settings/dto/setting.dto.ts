import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  group?: string;
}

export class BulkUpdateSettingsDto {
  settings: { key: string; value: string; group?: string }[];
}
