import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateDoctorDto) {
    const slug = dto.slug || this.generateSlug(dto.name);
    let { schedules, departmentId, ...doctorData } = dto;

    // Resolve or auto-create department if missing or invalid
    if (!departmentId) {
      let defaultDept = await this.prisma.department.findFirst({
        where: { slug: 'general-medicine' },
      });
      if (!defaultDept) {
        defaultDept = await this.prisma.department.create({
          data: {
            name: 'General Medicine',
            slug: 'general-medicine',
            description: 'General outpatient medical care and consultation',
            icon: 'Stethoscope',
          },
        });
      }
      departmentId = defaultDept.id;
    } else {
      const existing = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!existing) {
        let customDept = await this.prisma.department.findFirst({
          where: {
            OR: [{ slug: this.generateSlug(departmentId) }, { name: departmentId }],
          },
        });
        if (!customDept) {
          customDept = await this.prisma.department.create({
            data: {
              name: departmentId,
              slug: this.generateSlug(departmentId),
            },
          });
        }
        departmentId = customDept.id;
      }
    }

    return this.prisma.doctor.create({
      data: {
        ...doctorData,
        departmentId,
        slug,
        schedules: schedules && schedules.length > 0 ? {
          create: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            maxPatients: s.maxPatients ?? 20,
            isActive: s.isActive ?? true,
          })),
        } : undefined,
      },
      include: {
        department: true,
        schedules: true,
      },
    });
  }

  async findAll(params?: {
    departmentId?: string;
    specialization?: string;
    search?: string;
    activeOnly?: boolean;
  }) {
    const { departmentId, specialization, search, activeOnly } = params || {};

    return this.prisma.doctor.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
        ...(specialization ? { specialization: { contains: specialization } } : {}),
        ...(activeOnly ? { isActive: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { specialization: { contains: search } },
                { bio: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        department: true,
        schedules: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        department: true,
        schedules: true,
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findOne(id);
    const { schedules, ...doctorData } = dto;

    if (schedules) {
      // Replace schedules
      await this.prisma.schedule.deleteMany({ where: { doctorId: id } });
    }

    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...doctorData,
        schedules: schedules ? {
          create: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            maxPatients: s.maxPatients ?? 20,
            isActive: s.isActive ?? true,
          })),
        } : undefined,
      },
      include: {
        department: true,
        schedules: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.schedule.deleteMany({ where: { doctorId: id } });
    return this.prisma.doctor.delete({ where: { id } });
  }
}
