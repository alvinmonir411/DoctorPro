import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DoctorRegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsString()
  specialization: string;

  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  consultationFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experienceYears?: number;

  @IsOptional()
  @IsString()
  chamberAddress?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  certificate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  slotDuration?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  autoApprove?: boolean;
}

export class CreateAssistantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
