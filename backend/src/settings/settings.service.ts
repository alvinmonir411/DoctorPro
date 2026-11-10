import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(group?: string) {
    const list = await this.prisma.settings.findMany({
      where: group ? { group } : undefined,
    });
    // Transform into key-value map and full list
    const map: Record<string, string> = {};
    for (const item of list) {
      map[item.key] = item.value;
    }
    return { list, map };
  }

  async findByKey(key: string) {
    return this.prisma.settings.findUnique({ where: { key } });
  }

  async set(key: string, value: string, group = 'general') {
    return this.prisma.settings.upsert({
      where: { key },
      update: { value, group },
      create: { key, value, group },
    });
  }

  async updateBulk(settings: { key: string; value: string; group?: string }[]) {
    const results: any[] = [];
    for (const s of settings) {
      const res = await this.set(s.key, s.value, s.group);
      results.push(res);
    }
    return results;
  }
}
