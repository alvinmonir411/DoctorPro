import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  resolveScopedDoctorId,
  ScopedRequestUser,
} from '../common/utils/doctor-scope';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    const doctorScope = scopedDoctorId ? { doctorId: scopedDoctorId } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      absentAppointments,
      totalServices,
      totalDepartments,
      totalBlogs,
    ] = await Promise.all([
      scopedDoctorId
        ? Promise.resolve(1)
        : this.prisma.doctor.count({ where: { isActive: true } }),
      scopedDoctorId
        ? this.prisma.patient.count({
            where: { appointments: { some: { doctorId: scopedDoctorId } } },
          })
        : this.prisma.patient.count(),
      this.prisma.appointment.count({ where: doctorScope }),
      this.prisma.appointment.count({
        where: {
          ...doctorScope,
          date: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.appointment.count({ where: { ...doctorScope, status: 'PENDING' } }),
      this.prisma.appointment.count({ where: { ...doctorScope, status: 'CONFIRMED' } }),
      this.prisma.appointment.count({ where: { ...doctorScope, status: 'COMPLETED' } }),
      this.prisma.appointment.count({ where: { ...doctorScope, status: 'ABSENT' } }),
      this.prisma.service.count({ where: { isActive: true } }),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.blogPost.count(),
    ]);

    // Estimated revenue from completed appointments
    const completedApps = await this.prisma.appointment.findMany({
      where: { ...doctorScope, status: 'COMPLETED' },
      include: { doctor: { select: { consultationFee: true } } },
    });
    const totalRevenue = completedApps.reduce((acc, app) => acc + (app.doctor?.consultationFee || 0), 0);

    return {
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      absentAppointments,
      totalServices,
      totalDepartments,
      totalBlogs,
      totalRevenue,
    };
  }

  async getRecentAppointments(limit = 10, currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    return this.prisma.appointment.findMany({
      where: scopedDoctorId ? { doctorId: scopedDoctorId } : undefined,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { department: true } },
        patient: true,
      },
    });
  }

  async getUpcomingAppointments(limit = 10, currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        ...(scopedDoctorId ? { doctorId: scopedDoctorId } : {}),
        date: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      take: limit,
      orderBy: { date: 'asc' },
      include: {
        doctor: { include: { department: true } },
        patient: true,
      },
    });
  }
}
