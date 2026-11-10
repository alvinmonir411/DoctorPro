import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateDepartmentDto) {
    const slug = dto.slug || this.generateSlug(dto.name);
    return this.prisma.department.create({
      data: {
        ...dto,
        slug,
      },
    });
  }

  async findAll(activeOnly = false) {
    return this.prisma.department.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        _count: {
          select: { doctors: true, services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        doctors: { where: { isActive: true } },
        services: { where: { isActive: true } },
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.department.delete({ where: { id } });
  }
}
