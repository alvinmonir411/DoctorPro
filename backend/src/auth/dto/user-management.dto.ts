import { IsNotEmpty, IsEmail, IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateStaffUserDto {
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

  @IsNotEmpty()
  @IsIn(['ADMIN', 'DOCTOR', 'DOCTOR_ASSISTANT'])
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}

export class UpdateStaffUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['ADMIN', 'DOCTOR', 'DOCTOR_ASSISTANT'])
  role?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}
