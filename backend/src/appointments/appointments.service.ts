import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookPublicAppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async bookPublic(dto: BookPublicAppointmentDto) {
    // Check doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      include: { schedules: true },
    });
    if (!doctor || !doctor.isActive) {
      throw new BadRequestException('Selected doctor is not available');
    }

    // Find or create patient by phone
    let patient = await this.prisma.patient.findFirst({
      where: { phone: dto.patientPhone },
    });

    if (!patient) {
      patient = await this.prisma.patient.create({
        data: {
          name: dto.patientName,
          phone: dto.patientPhone,
          email: dto.patientEmail,
        },
      });
    } else if (dto.patientEmail && !patient.email) {
      patient = await this.prisma.patient.update({
        where: { id: patient.id },
        data: { email: dto.patientEmail },
      });
    }

    const appointmentDate = new Date(dto.date);
    const status = doctor.autoApprove ? 'CONFIRMED' : 'PENDING';

    return this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date: appointmentDate,
        timeSlot: dto.timeSlot,
        notes: dto.notes,
        type: dto.type || 'NEW',
        status,
      },
      include: {
        doctor: {
          include: { department: true },
        },
        patient: true,
      },
    });
  }

  async create(dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        date: new Date(dto.date),
        timeSlot: dto.timeSlot,
        status: dto.status || 'PENDING',
        type: dto.type || 'NEW',
        notes: dto.notes,
      },
      include: {
        doctor: true,
        patient: true,
      },
    });
  }

  async findAll(params?: {
    doctorId?: string;
    patientId?: string;
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { doctorId, patientId, status, date, startDate, endDate } = params || {};

    let dateFilter: any = undefined;
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      dateFilter = { gte: startOfDay, lte: endOfDay };
    } else if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }

    return this.prisma.appointment.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        ...(patientId ? { patientId } : {}),
        ...(status ? { status } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: {
        doctor: {
          include: { department: true },
        },
        patient: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { department: true },
        },
        patient: true,
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: {
        doctor: {
          include: { department: true },
        },
        patient: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.appointment.delete({ where: { id } });
  }

  async getAvailableSlots(doctorId: string, dateStr: string) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0-6

    // Find doctor's schedule for this day
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      return { available: false, message: 'Doctor is not available on this day', slots: [] };
    }

    // Get doctor's slot duration (default 30 mins, or 10, 15, 20, 30, 45, 60 mins)
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { slotDuration: true },
    });
    const slotDuration = doctor?.slotDuration && doctor.slotDuration > 0 ? doctor.slotDuration : 30;

    // Generate slots between startTime and endTime
    const slots: string[] = [];
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + slotDuration <= endMinutes) {
      const h1 = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const m1 = (currentMinutes % 60).toString().padStart(2, '0');
      const nextMin = currentMinutes + slotDuration;
      const h2 = Math.floor(nextMin / 60).toString().padStart(2, '0');
      const m2 = (nextMin % 60).toString().padStart(2, '0');

      slots.push(`${h1}:${m1} - ${h2}:${m2}`);
      currentMinutes += slotDuration;
    }

    // Check booked appointments on that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { timeSlot: true },
    });

    const bookedSlots = booked.map((b) => b.timeSlot);
    const availableSlots = slots.map((slot) => ({
      slot,
      isBooked: bookedSlots.includes(slot),
    }));

    return {
      available: true,
      dayOfWeek,
      schedule,
      slots: availableSlots,
    };
  }
}
