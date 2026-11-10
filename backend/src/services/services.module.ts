import { Module } from '@nestjs/common';
import { MedicalServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
  controllers: [ServicesController],
  providers: [MedicalServicesService],
  exports: [MedicalServicesService],
})
export class MedicalServicesModule {}
