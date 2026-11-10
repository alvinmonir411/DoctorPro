import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class BookPublicAppointmentDto {
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsNotEmpty()
  @IsString()
  date: string; // "YYYY-MM-DD"

  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @IsNotEmpty()
  @IsString()
  patientName: string;

  @IsNotEmpty()
  @IsString()
  patientPhone: string;

  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  type?: string; // NEW | FOLLOW_UP
}

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  status?: string; // PENDING | CONFIRMED | COMPLETED | CANCELLED

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  timeSlot?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
