import {
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  IsEmail,
  IsIn,
} from 'class-validator';

export class SubscribePushDto {
  @IsObject()
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsOptional()
  @IsNumber()
  serialNumber?: number;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class UnsubscribePushDto {
  @IsString()
  endpoint: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;
}

export class UpdateEmailConfigDto {
  @IsOptional()
  @IsIn(['auto', 'resend', 'smtp'])
  provider?: string;

  @IsOptional()
  @IsString()
  resendApiKey?: string;

  @IsOptional()
  @IsString()
  resendFrom?: string;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsString()
  smtpPort?: string;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPass?: string;

  @IsOptional()
  @IsString()
  smtpFrom?: string;
}

export class TestEmailDto {
  @IsEmail()
  to: string;
}
