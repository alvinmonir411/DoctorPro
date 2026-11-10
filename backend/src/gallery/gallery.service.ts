import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryDto, UpdateGalleryDto } from './dto/gallery.dto';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGalleryDto) {
    return this.prisma.gallery.create({ data: dto });
  }

  async findAll(category?: string, activeOnly = false) {
    return this.prisma.gallery.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.gallery.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Gallery item not found');
    return item;
  }

  async update(id: string, dto: UpdateGalleryDto) {
    await this.findOne(id);
    return this.prisma.gallery.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.gallery.delete({ where: { id } });
  }
}
