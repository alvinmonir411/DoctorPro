import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildRatingSummary,
  formatPublicReview,
} from '../common/utils/ratings';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import {
  assertNotAssistantRole,
  resolveScopedDoctorId,
  ScopedRequestUser,
} from '../common/utils/doctor-scope';

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
    topRated?: boolean;
    sortBy?: string;
  }) {
    const {
      departmentId,
      specialization,
      search,
      activeOnly,
      topRated,
      sortBy,
    } = params || {};

    const doctors = await this.prisma.doctor.findMany({
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

    if (doctors.length === 0) {
      return [];
    }

    const aggregates = await this.prisma.doctorReview.groupBy({
      by: ['doctorId'],
      where: {
        doctorId: { in: doctors.map((d) => d.id) },
        isActive: true,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const statsByDoctorId = new Map(
      aggregates.map((item) => [
        item.doctorId,
        {
          averageRating: Math.round(((item._avg.rating || 0) * 10)) / 10,
          reviewCount: item._count.rating || 0,
        },
      ]),
    );

    const enriched = doctors.map((doc) => {
      const stat = statsByDoctorId.get(doc.id);
      return {
        ...doc,
        averageRating: stat?.averageRating ?? 0,
        reviewCount: stat?.reviewCount ?? 0,
      };
    });

    if (topRated || sortBy === 'rating') {
      enriched.sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }
        if ((b.experienceYears || 0) !== (a.experienceYears || 0)) {
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    return enriched;
  }

  async findMyProfile(currentUser?: ScopedRequestUser) {
    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    const targetId = scopedDoctorId || currentUser?.doctorId;
    if (!targetId) {
      return null;
    }
    return this.findOne(targetId);
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        department: true,
        schedules: true,
        reviews: {
          where: { isActive: true },
          include: {
            appointment: {
              select: { date: true, timeSlot: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const rawReviews = doctor.reviews || [];
    const summary = buildRatingSummary(rawReviews);

    return {
      ...doctor,
      ...summary,
      reviews: rawReviews.map(formatPublicReview),
    };
  }

  async update(id: string, dto: UpdateDoctorDto, currentUser?: ScopedRequestUser) {
    assertNotAssistantRole(currentUser, 'Assistants cannot modify doctor profile details.');
    const existing = await this.findOne(id);

    const scopedDoctorId = await resolveScopedDoctorId(this.prisma, currentUser);
    if (scopedDoctorId && existing.id !== scopedDoctorId) {
      throw new ForbiddenException('You can only edit your own doctor profile.');
    }

    const { schedules, ...doctorData } = dto;
    if (scopedDoctorId) {
      // Doctors cannot self-activate or change admin approval status
      delete (doctorData as any).isActive;
    }

    if (schedules) {
      // Replace schedules
      await this.prisma.schedule.deleteMany({ where: { doctorId: existing.id } });
    }

    return this.prisma.doctor.update({
      where: { id: existing.id },
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
