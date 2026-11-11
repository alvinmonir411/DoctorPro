import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  resolveScopedDoctorId,
  ScopedRequestUser,
} from '../common/utils/doctor-scope';
import {
  BookPublicAppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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

    // Compute serial number for this doctor on this day
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingCount = await this.prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
    });
    const serialNumber = existingCount + 1;

    const created = await this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date: appointmentDate,
        timeSlot: dto.timeSlot,
        notes: dto.notes,
        type: dto.type || 'NEW',
        status,
        serialNumber,
      },
      include: {
        doctor: {
          include: { department: true },
        },
        patient: true,
      },
    });

    this.notifications.notifyBookingConfirmation(created).catch(() => {});
    return created;
  }

  async create(dto: CreateAppointmentDto, currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    if (scopedDoctorId && dto.doctorId !== scopedDoctorId) {
      throw new ForbiddenException('You can only create appointments for your own practice.');
    }

    const effectiveDoctorId = scopedDoctorId ?? dto.doctorId;
    const appointmentDate = new Date(dto.date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingCount = await this.prisma.appointment.count({
      where: {
        doctorId: effectiveDoctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
    });
    const serialNumber = existingCount + 1;

    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: effectiveDoctorId,
        date: appointmentDate,
        timeSlot: dto.timeSlot,
        status: dto.status || 'PENDING',
        type: dto.type || 'NEW',
        notes: dto.notes,
        serialNumber,
      },
      include: {
        doctor: true,
        patient: true,
      },
    });
  }

  async findAll(
    params?: {
      doctorId?: string;
      patientId?: string;
      status?: string;
      date?: string;
      startDate?: string;
      endDate?: string;
    },
    currentUser?: ScopedRequestUser,
  ) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    const { doctorId, patientId, status, date, startDate, endDate } = params || {};
    const effectiveDoctorId = scopedDoctorId ?? doctorId;

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
        ...(effectiveDoctorId ? { doctorId: effectiveDoctorId } : {}),
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
      orderBy: [{ date: 'asc' }, { serialNumber: 'asc' }],
    });
  }

  async findOne(id: string, currentUser?: ScopedRequestUser) {
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

    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    if (scopedDoctorId && appointment.doctorId !== scopedDoctorId) {
      throw new ForbiddenException('You can only access your own appointments.');
    }

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, currentUser?: ScopedRequestUser) {
    const existing = await this.findOne(id, currentUser);
    const updated = await this.prisma.appointment.update({
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

    const today = new Date();
    const apptDate = new Date(updated.date);
    const isToday =
      apptDate.getFullYear() === today.getFullYear() &&
      apptDate.getMonth() === today.getMonth() &&
      apptDate.getDate() === today.getDate();

    let handledByQueue = false;
    if (
      updated.status === 'SERVING' &&
      updated.serialNumber &&
      isToday
    ) {
      handledByQueue = true;
      await this.prisma.doctor
        .update({
          where: { id: updated.doctorId },
          data: {
            currentServingSerial: updated.serialNumber,
            chamberStatus: 'ACTIVE',
          },
        })
        .catch(() => {});
      this.notifications
        .notifyQueueTurnUpdates(updated.doctor, updated.serialNumber, 'ACTIVE')
        .catch(() => {});
    }

    if (updated.status !== existing.status) {
      this.notifications
        .notifyAppointmentStatusChange(updated, existing.status, handledByQueue)
        .catch(() => {});
    }

    return updated;
  }

  async remove(id: string, currentUser?: ScopedRequestUser) {
    await this.findOne(id, currentUser);
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

    // Get doctor's slot duration & appointment window
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { slotDuration: true, appointmentStartTime: true, appointmentEndTime: true },
    });
    const slotDuration = doctor?.slotDuration && doctor.slotDuration > 0 ? doctor.slotDuration : 30;

    // Use schedule hours, falling back to doctor's configured appointment hours
    const effectiveStartTime = schedule.startTime || doctor?.appointmentStartTime || '09:00';
    const effectiveEndTime = schedule.endTime || doctor?.appointmentEndTime || '17:00';

    // Generate slots between startTime and endTime
    const slots: string[] = [];
    const [startH, startM] = effectiveStartTime.split(':').map(Number);
    const [endH, endM] = effectiveEndTime.split(':').map(Number);

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
        status: { in: ['PENDING', 'CONFIRMED', 'SERVING'] },
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

  // ─── Real-Time Chamber Queue & Live Serial Tracking ───

  private getDayWindow(dateInput?: string | Date) {
    const base = dateInput ? new Date(dateInput) : new Date();
    const startOfDay = new Date(base);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(base);
    endOfDay.setHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  private formatLockedChamberView(doctor: any, otherDoctorAppointment: any = null) {
    return {
      hasActiveBooking: false,
      requiresBooking: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        title: doctor.title,
        specialization: doctor.specialization,
        department: doctor.department?.name,
        image: doctor.image,
        chamberAddress: doctor.chamberAddress,
        phone: doctor.phone,
        slotDuration: doctor.slotDuration || 15,
        chamberStatus: doctor.chamberStatus || 'ACTIVE',
      },
      currentlyServing: null,
      stats: null,
      myQueueStatus: null,
      otherDoctorAppointment,
      queueList: [],
      timestamp: new Date().toISOString(),
    };
  }

  async getManageLiveQueue(doctorId?: string, currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    const effectiveDoctorId = scopedDoctorId ?? doctorId?.trim();
    if (!effectiveDoctorId) {
      throw new BadRequestException('doctorId is required');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: effectiveDoctorId },
      include: { department: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const { startOfDay, endOfDay } = this.getDayWindow();
    return this.formatChamberQueue(doctor, startOfDay, endOfDay, null, null);
  }

  async getLiveQueue(params: {
    doctorId?: string;
    appointmentId?: string;
    phone?: string;
    date?: string;
  }) {
    const { startOfDay, endOfDay } = this.getDayWindow(params.date);

    const requestedDoctorId = params.doctorId?.trim() || undefined;
    const cleanPhone = params.phone?.trim() || undefined;
    let targetAppointment: any = null;

    // 1. If appointmentId is provided, only bind if active and matches requestedDoctorId (when specified)
    if (params.appointmentId) {
      const candidate = await this.prisma.appointment.findUnique({
        where: { id: params.appointmentId },
        include: {
          doctor: { include: { department: true } },
          patient: true,
        },
      });
      if (
        candidate &&
        candidate.status !== 'CANCELLED' &&
        (!requestedDoctorId || candidate.doctorId === requestedDoctorId)
      ) {
        targetAppointment = candidate;
      }
    }

    // 2. If phone is provided, find today's active appointment for that phone (scoped to requestedDoctorId if given)
    if (!targetAppointment && cleanPhone) {
      targetAppointment = await this.prisma.appointment.findFirst({
        where: {
          patient: { phone: cleanPhone },
          ...(requestedDoctorId ? { doctorId: requestedDoctorId } : {}),
          date: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { include: { department: true } },
          patient: true,
        },
      });
    }

    // 3. Respect explicit requestedDoctorId strictly so switching chambers never jumps back to another doctor
    const doctorId = requestedDoctorId || targetAppointment?.doctorId;
    if (!doctorId) {
      const defaultDoc = await this.prisma.doctor.findFirst({
        where: { isActive: true },
        include: { department: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultDoc) {
        throw new NotFoundException('No active doctors found');
      }
      return this.formatLockedChamberView(defaultDoc, null);
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { department: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // Only patients with an active booking today for this doctor can view live queue details
    if (!targetAppointment) {
      let otherDoctorAppointment: any = null;
      if (cleanPhone && requestedDoctorId) {
        const other = await this.prisma.appointment.findFirst({
          where: {
            patient: { phone: cleanPhone },
            doctorId: { not: requestedDoctorId },
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: 'CANCELLED' },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
          },
        });
        if (other) {
          otherDoctorAppointment = {
            appointmentId: other.id,
            doctorId: other.doctorId,
            doctorName: other.doctor.name,
            specialization: other.doctor.specialization,
            serialNumber: other.serialNumber,
            timeSlot: other.timeSlot,
          };
        }
      }
      return this.formatLockedChamberView(doctor, otherDoctorAppointment);
    }

    return this.formatChamberQueue(
      doctor,
      startOfDay,
      endOfDay,
      targetAppointment,
      null,
    );
  }

  private async formatChamberQueue(
    doctor: any,
    startOfDay: Date,
    endOfDay: Date,
    myAppointment: any,
    otherDoctorAppointment: any = null,
  ) {
    const slotDuration = doctor.slotDuration || 15;
    const currentServingSerial = doctor.currentServingSerial || 0;
    const chamberStatus = doctor.chamberStatus || 'ACTIVE';

    // Fetch all non-cancelled appointments for today
    const appointmentsToday = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
      include: { patient: true },
      orderBy: [{ serialNumber: 'asc' }, { timeSlot: 'asc' }],
    });

    const totalPatientsToday = appointmentsToday.length;
    const maxSerialToday = appointmentsToday.reduce(
      (max, a, idx) => Math.max(max, a.serialNumber || idx + 1),
      0,
    );
    const completedCount = appointmentsToday.filter(
      (a) => a.status === 'COMPLETED' || (a.serialNumber && a.serialNumber < currentServingSerial),
    ).length;

    // Find who is currently serving
    const currentlyServingAppointment = appointmentsToday.find(
      (a) => a.serialNumber === currentServingSerial || a.status === 'SERVING',
    );

    // Calculate details for myAppointment if provided
    let mySerial = myAppointment?.serialNumber || null;
    let patientsAhead = 0;
    let estimatedWaitMinutes = 0;
    let isCurrentlyServing = false;
    let isNext = false;
    let isCompleted = false;

    if (myAppointment) {
      // If no serialNumber was explicitly assigned, find index + 1
      if (!mySerial) {
        const idx = appointmentsToday.findIndex((a) => a.id === myAppointment.id);
        mySerial = idx >= 0 ? idx + 1 : 1;
      }

      if (currentServingSerial > 0) {
        if (mySerial === currentServingSerial && chamberStatus === 'ACTIVE') {
          isCurrentlyServing = true;
          patientsAhead = 0;
          estimatedWaitMinutes = 0;
        } else if (mySerial < currentServingSerial || myAppointment.status === 'COMPLETED') {
          isCompleted = true;
          patientsAhead = 0;
          estimatedWaitMinutes = 0;
        } else {
          patientsAhead = Math.max(0, mySerial - currentServingSerial);
          estimatedWaitMinutes = patientsAhead * slotDuration;
          if (patientsAhead === 1) isNext = true;
        }
      } else {
        // Doctor hasn't started yet
        patientsAhead = mySerial;
        estimatedWaitMinutes = mySerial * slotDuration;
        if (mySerial === 1) isNext = true;
      }
    }

    // Mask patient names for public privacy (e.g. "Md. Rahim" -> "M***m", Serial #1)
    const queueList = appointmentsToday.map((a, idx) => {
      const serial = a.serialNumber || idx + 1;
      const rawName = a.patient?.name || 'Patient';
      const maskedName =
        rawName.length > 2
          ? `${rawName.charAt(0)}***${rawName.charAt(rawName.length - 1)}`
          : rawName;

      return {
        id: a.id,
        serialNumber: serial,
        timeSlot: a.timeSlot,
        status: a.status,
        maskedName,
        isServing: serial === currentServingSerial && chamberStatus === 'ACTIVE',
        isCompleted: a.status === 'COMPLETED' || (currentServingSerial > 0 && serial < currentServingSerial),
      };
    });

    return {
      hasActiveBooking: Boolean(myAppointment),
      requiresBooking: false,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        title: doctor.title,
        specialization: doctor.specialization,
        department: doctor.department?.name,
        image: doctor.image,
        chamberAddress: doctor.chamberAddress,
        phone: doctor.phone,
        slotDuration,
        currentServingSerial,
        chamberStatus,
      },
      currentlyServing: currentlyServingAppointment
        ? {
            serialNumber: currentlyServingAppointment.serialNumber || currentServingSerial,
            timeSlot: currentlyServingAppointment.timeSlot,
            patientName: currentlyServingAppointment.patient?.name,
          }
        : currentServingSerial > 0
        ? { serialNumber: currentServingSerial, timeSlot: 'In Progress', patientName: `Serial #${currentServingSerial}` }
        : null,
      stats: {
        totalPatientsToday,
        maxSerialToday,
        completedCount,
        waitingCount: Math.max(0, totalPatientsToday - completedCount),
      },
      myQueueStatus: myAppointment
        ? {
            appointmentId: myAppointment.id,
            patientName: myAppointment.patient?.name,
            patientPhone: myAppointment.patient?.phone,
            yourSerial: mySerial,
            timeSlot: myAppointment.timeSlot,
            appointmentStatus: myAppointment.status,
            patientsAhead,
            estimatedWaitMinutes,
            isCurrentlyServing,
            isNext,
            isCompleted,
            message: isCurrentlyServing
              ? '🟢 You are currently in consultation with the doctor!'
              : isNext
              ? '🔥 You are NEXT in line! Please stand by near the chamber.'
              : isCompleted
              ? '✓ Consultation completed.'
              : `${patientsAhead} patient(s) ahead of you. Estimated wait: ~${estimatedWaitMinutes} minutes.`,
          }
        : null,
      otherDoctorAppointment,
      queueList,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Advance / Manage Live Chamber Queue (Doctor or Assistant) ───

  async advanceLiveQueue(
    doctorId: string,
    action: string,
    targetSerial?: number,
    currentUser?: ScopedRequestUser,
  ) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    if (scopedDoctorId && doctorId && doctorId !== scopedDoctorId) {
      throw new ForbiddenException('You can only manage your own live chamber queue.');
    }
    const effectiveDoctorId = scopedDoctorId ?? doctorId;

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: effectiveDoctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const { startOfDay, endOfDay } = this.getDayWindow();

    const todaysAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: effectiveDoctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
      orderBy: [{ serialNumber: 'asc' }, { timeSlot: 'asc' }],
      select: { id: true, serialNumber: true, status: true },
    });
    const totalBookedToday = todaysAppointments.length;
    const maxSerialToday = todaysAppointments.reduce(
      (max, a, idx) => Math.max(max, a.serialNumber || idx + 1),
      0,
    );

    let nextSerial = doctor.currentServingSerial || 0;
    let nextStatus = doctor.chamberStatus || 'ACTIVE';

    if (action === 'NEXT') {
      if (maxSerialToday === 0) {
        throw new BadRequestException(
          'No appointments booked for today yet. You can only call next patient when appointments are booked.',
        );
      }
      if (nextSerial >= maxSerialToday) {
        throw new BadRequestException(
          `Cannot advance beyond Serial #${maxSerialToday}. Only ${totalBookedToday} appointment(s) booked today.`,
        );
      }

      // Mark current serving appointment as COMPLETED
      if (nextSerial > 0) {
        await this.prisma.appointment.updateMany({
          where: {
            doctorId: effectiveDoctorId,
            date: { gte: startOfDay, lte: endOfDay },
            serialNumber: nextSerial,
            status: { not: 'CANCELLED' },
          },
          data: { status: 'COMPLETED' },
        });
      }

      nextSerial = nextSerial + 1;
      nextStatus = 'ACTIVE';

      // Mark new serial appointment as SERVING
      await this.prisma.appointment.updateMany({
        where: {
          doctorId: effectiveDoctorId,
          date: { gte: startOfDay, lte: endOfDay },
          serialNumber: nextSerial,
          status: { not: 'CANCELLED' },
        },
        data: { status: 'SERVING' },
      });
    } else if (action === 'COMPLETE_CURRENT') {
      if (nextSerial > 0) {
        await this.prisma.appointment.updateMany({
          where: {
            doctorId: effectiveDoctorId,
            date: { gte: startOfDay, lte: endOfDay },
            serialNumber: nextSerial,
            status: { not: 'CANCELLED' },
          },
          data: { status: 'COMPLETED' },
        });
      }
    } else if (action === 'PREV') {
      if (nextSerial > 0) {
        await this.prisma.appointment.updateMany({
          where: {
            doctorId: effectiveDoctorId,
            date: { gte: startOfDay, lte: endOfDay },
            serialNumber: nextSerial,
            status: 'SERVING',
          },
          data: { status: 'CONFIRMED' },
        });
      }
      const stepped = Math.max(0, nextSerial - 1);
      nextSerial = maxSerialToday > 0 ? Math.min(stepped, maxSerialToday) : 0;
      if (nextSerial > 0) {
        await this.prisma.appointment.updateMany({
          where: {
            doctorId: effectiveDoctorId,
            date: { gte: startOfDay, lte: endOfDay },
            serialNumber: nextSerial,
            status: { not: 'CANCELLED' },
          },
          data: { status: 'SERVING' },
        });
      }
    } else if (action === 'RESET') {
      nextSerial = 0;
      nextStatus = 'ACTIVE';
      await this.prisma.appointment.updateMany({
        where: {
          doctorId: effectiveDoctorId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ['SERVING', 'COMPLETED'] },
        },
        data: { status: 'CONFIRMED' },
      });
    } else if (action === 'BREAK') {
      nextStatus = doctor.chamberStatus === 'BREAK' ? 'ACTIVE' : 'BREAK';
    } else if (action === 'SET' && typeof targetSerial === 'number') {
      nextSerial = Math.max(0, Math.min(maxSerialToday, targetSerial));
    }

    const updatedDoctor = await this.prisma.doctor.update({
      where: { id: effectiveDoctorId },
      data: {
        currentServingSerial: nextSerial,
        chamberStatus: nextStatus,
      },
      include: { department: true },
    });

    if (action !== 'RESET' && action !== 'COMPLETE_CURRENT') {
      this.notifications
        .notifyQueueTurnUpdates(updatedDoctor, nextSerial, nextStatus)
        .catch(() => {});
    }

    return this.formatChamberQueue(updatedDoctor, startOfDay, endOfDay, null, null);
  }
}
