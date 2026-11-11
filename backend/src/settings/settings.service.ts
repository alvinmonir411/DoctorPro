import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(group?: string) {
    if (group === 'secret') {
      return { list: [], map: {} };
    }
    const list = await this.prisma.settings.findMany({
      where: group ? { group } : { group: { not: 'secret' } },
    });
    // Transform into key-value map and full list
    const map: Record<string, string> = {};
    for (const item of list) {
      map[item.key] = item.value;
    }
    return { list, map };
  }

  async findByKey(key: string) {
    const item = await this.prisma.settings.findUnique({ where: { key } });
    if (item?.group === 'secret') {
      return null;
    }
    return item;
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
