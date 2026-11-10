import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
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
      totalServices,
      totalDepartments,
      totalBlogs,
    ] = await Promise.all([
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.prisma.patient.count(),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.appointment.count({ where: { status: 'PENDING' } }),
      this.prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.service.count({ where: { isActive: true } }),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.blogPost.count(),
    ]);

    // Estimated revenue from completed appointments
    const completedApps = await this.prisma.appointment.findMany({
      where: { status: 'COMPLETED' },
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
      totalServices,
      totalDepartments,
      totalBlogs,
      totalRevenue,
    };
  }

  async getRecentAppointments(limit = 10) {
    return this.prisma.appointment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { department: true } },
        patient: true,
      },
    });
  }

  async getUpcomingAppointments(limit = 10) {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
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
