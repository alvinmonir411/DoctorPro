import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class MedicalServicesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateServiceDto) {
    const slug = dto.slug || this.generateSlug(dto.name);
    return this.prisma.service.create({
      data: {
        ...dto,
        slug,
      },
      include: { department: true },
    });
  }

  async findAll(departmentId?: string, activeOnly = false) {
    return this.prisma.service.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: { department: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: dto,
      include: { department: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.service.delete({ where: { id } });
  }
}
