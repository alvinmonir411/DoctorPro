import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import {
  resolveScopedDoctorId,
  ScopedRequestUser,
} from '../common/utils/doctor-scope';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  private parseUtcDateBounds(dateStr?: string) {
    const trimmed = dateStr?.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return {
        startOfDay: new Date(`${trimmed}T00:00:00.000Z`),
        endOfDay: new Date(`${trimmed}T23:59:59.999Z`),
      };
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    const startOfDay = new Date(parsed);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(parsed);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  async findAll(
    query?: string | { search?: string; date?: string; status?: string },
    currentUser?: ScopedRequestUser,
  ) {
    const params =
      typeof query === 'string' ? { search: query } : query || {};
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);

    const cleanSearch = params.search?.trim() || '';
    const dateBounds = this.parseUtcDateBounds(params.date);
    const upperStatus = params.status?.trim().toUpperCase() || '';

    const statusClause =
      !upperStatus || upperStatus === 'ALL'
        ? undefined
        : upperStatus === 'ACTIVE'
        ? { in: ['PENDING', 'CONFIRMED', 'SERVING'] }
        : upperStatus;

    const appointmentScope: any = {
      ...(scopedDoctorId ? { doctorId: scopedDoctorId } : {}),
      ...(dateBounds
        ? { date: { gte: dateBounds.startOfDay, lte: dateBounds.endOfDay } }
        : {}),
      ...(statusClause ? { status: statusClause } : {}),
    };

    const hasApptFilter = Object.keys(appointmentScope).length > 0;

    let searchFilter: any = undefined;
    if (cleanSearch) {
      const numericCandidate = /^#?\d+$/.test(cleanSearch)
        ? Number(cleanSearch.replace(/^#/, ''))
        : null;
      const serialCandidate =
        numericCandidate !== null &&
        Number.isSafeInteger(numericCandidate) &&
        numericCandidate > 0 &&
        numericCandidate < 100000
          ? numericCandidate
          : null;
      const searchDateBounds = /^\d{4}-\d{2}-\d{2}$/.test(cleanSearch)
        ? this.parseUtcDateBounds(cleanSearch)
        : null;

      searchFilter = {
        OR: [
          { id: { contains: cleanSearch, mode: 'insensitive' } },
          { name: { contains: cleanSearch, mode: 'insensitive' } },
          { phone: { contains: cleanSearch, mode: 'insensitive' } },
          { email: { contains: cleanSearch, mode: 'insensitive' } },
          { address: { contains: cleanSearch, mode: 'insensitive' } },
          { gender: { contains: cleanSearch, mode: 'insensitive' } },
          { bloodGroup: { contains: cleanSearch, mode: 'insensitive' } },
          {
            appointments: {
              some: {
                ...appointmentScope,
                notes: { contains: cleanSearch, mode: 'insensitive' },
              },
            },
          },
          {
            appointments: {
              some: {
                ...appointmentScope,
                timeSlot: { contains: cleanSearch, mode: 'insensitive' },
              },
            },
          },
          {
            appointments: {
              some: {
                ...appointmentScope,
                status: { contains: cleanSearch, mode: 'insensitive' },
              },
            },
          },
          {
            appointments: {
              some: {
                ...appointmentScope,
                type: { contains: cleanSearch, mode: 'insensitive' },
              },
            },
          },
          {
            appointments: {
              some: {
                ...appointmentScope,
                id: { contains: cleanSearch, mode: 'insensitive' },
              },
            },
          },
          {
            appointments: {
              some: {
                ...appointmentScope,
                doctor: { name: { contains: cleanSearch, mode: 'insensitive' } },
              },
            },
          },
          {
            appointments: {
              some: {
                ...appointmentScope,
                doctor: {
                  specialization: { contains: cleanSearch, mode: 'insensitive' },
                },
              },
            },
          },
          ...(serialCandidate !== null
            ? [
                {
                  appointments: {
                    some: { ...appointmentScope, serialNumber: serialCandidate },
                  },
                },
              ]
            : []),
          ...(searchDateBounds
            ? [
                {
                  appointments: {
                    some: {
                      ...appointmentScope,
                      date: {
                        gte: searchDateBounds.startOfDay,
                        lte: searchDateBounds.endOfDay,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      };
    }

    const andClauses: any[] = [];
    if (searchFilter) andClauses.push(searchFilter);
    if (hasApptFilter) {
      andClauses.push({ appointments: { some: appointmentScope } });
    }
    const where = andClauses.length > 0 ? { AND: andClauses } : undefined;

    const patients = await this.prisma.patient.findMany({
      where,
      include: {
        appointments: {
          where: hasApptFilter ? appointmentScope : undefined,
          include: {
            doctor: { select: { id: true, name: true, specialization: true } },
          },
          orderBy: dateBounds
            ? [{ serialNumber: 'asc' }, { timeSlot: 'asc' }]
            : [{ date: 'desc' }, { serialNumber: 'asc' }],
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return patients.map((pt) => {
      const summary = pt.appointments.reduce(
        (acc, a) => {
          const st = (a.status || '').toUpperCase();
          acc.total += 1;
          if (st === 'COMPLETED') acc.completed += 1;
          else if (st === 'ABSENT') acc.absent += 1;
          else if (st === 'CANCELLED') acc.cancelled += 1;
          else acc.active += 1;
          return acc;
        },
        { total: 0, completed: 0, absent: 0, cancelled: 0, active: 0 },
      );

      return {
        ...pt,
        _count: { appointments: pt.appointments.length },
        visitSummary: summary,
      };
    });
  }

  async findOne(id: string, currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          where: scopedDoctorId ? { doctorId: scopedDoctorId } : undefined,
          include: { doctor: true },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    if (scopedDoctorId && patient.appointments.length === 0) {
      throw new ForbiddenException('You can only view records of patients booked with you.');
    }
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, currentUser?: ScopedRequestUser) {
    await this.findOne(id, currentUser);
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async remove(id: string, currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    await this.findOne(id, currentUser);
    if (scopedDoctorId) {
      const otherDoctorCount = await this.prisma.appointment.count({
        where: { patientId: id, doctorId: { not: scopedDoctorId } },
      });
      if (otherDoctorCount > 0) {
        throw new ForbiddenException(
          'Only clinic administration can delete a patient with appointments under other doctors.',
        );
      }
    }
    return this.prisma.patient.delete({ where: { id } });
  }
}
