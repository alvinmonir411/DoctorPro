import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PatientsModule } from './patients/patients.module';
import { DepartmentsModule } from './departments/departments.module';
import { MedicalServicesModule } from './services/services.module';
import { BlogModule } from './blog/blog.module';
import { GalleryModule } from './gallery/gallery.module';
import { SettingsModule } from './settings/settings.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ...(!process.env.VERCEL ? [ScheduleModule.forRoot()] : []),
    ...(!process.env.VERCEL && existsSync(join(process.cwd(), 'uploads'))
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
          }),
        ]
      : []),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    DoctorsModule,
    AppointmentsModule,
    PatientsModule,
    DepartmentsModule,
    MedicalServicesModule,
    BlogModule,
    GalleryModule,
    SettingsModule,
    TestimonialsModule,
    ReviewsModule,
    DashboardModule,
    UploadModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
