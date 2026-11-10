import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(authorId: string, dto: CreateBlogPostDto) {
    const slug = dto.slug || this.generateSlug(dto.title);
    return this.prisma.blogPost.create({
      data: {
        ...dto,
        slug,
        authorId,
        publishedAt: dto.isPublished ? new Date() : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(params?: { category?: string; search?: string; publishedOnly?: boolean }) {
    const { category, search, publishedOnly } = params || {};
    return this.prisma.blogPost.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(publishedOnly ? { isPublished: true } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { content: { contains: search } },
                { excerpt: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const post = await this.findOne(id);
    let publishedAt = post.publishedAt;
    if (dto.isPublished && !post.isPublished) {
      publishedAt = new Date();
    } else if (dto.isPublished === false) {
      publishedAt = null;
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...dto,
        publishedAt,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.blogPost.delete({ where: { id } });
  }
}
