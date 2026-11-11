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

  async findAll(search?: string, currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined;

    const where = scopedDoctorId
      ? {
          AND: [
            ...(searchFilter ? [searchFilter] : []),
            { appointments: { some: { doctorId: scopedDoctorId } } },
          ],
        }
      : searchFilter;

    const patients = await this.prisma.patient.findMany({
      where,
      include: {
        appointments: {
          where: scopedDoctorId ? { doctorId: scopedDoctorId } : undefined,
          include: { doctor: true },
          orderBy: { date: 'desc' },
          take: scopedDoctorId ? undefined : 5,
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!scopedDoctorId) return patients;

    return patients.map((pt) => ({
      ...pt,
      _count: { appointments: pt.appointments.length },
      appointments: pt.appointments.slice(0, 5),
    }));
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
