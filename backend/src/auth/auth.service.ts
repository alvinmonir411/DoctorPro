import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffUserDto, UpdateStaffUserDto } from './dto/user-management.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let doctor: any = null;
    if (user.doctorId) {
      doctor = await this.prisma.doctor.findUnique({
        where: { id: user.doctorId },
        include: { department: true },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      doctorId: user.doctorId,
    };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        doctorId: user.doctorId,
        doctor,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        doctorId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let doctor: any = null;
    if (user.doctorId) {
      doctor = await this.prisma.doctor.findUnique({
        where: { id: user.doctorId },
        include: { department: true },
      });
    }

    return { ...user, doctor };
  }

  // ─── Staff & Role Management (ADMIN only) ───

  async getStaffUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        doctorId: true,
        createdAt: true,
      },
    });

    // Populate doctor details for each user
    const doctors = await this.prisma.doctor.findMany({
      select: { id: true, name: true, specialization: true, slotDuration: true, autoApprove: true },
    });
    const doctorMap = new Map(doctors.map((d) => [d.id, d]));

    return users.map((u) => ({
      ...u,
      doctor: u.doctorId ? doctorMap.get(u.doctorId) || null : null,
    }));
  }

  async createStaffUser(dto: CreateStaffUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A user account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        doctorId: dto.doctorId || null,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        doctorId: true,
        createdAt: true,
      },
    });

    return user;
  }

  async updateStaffUser(id: string, dto: UpdateStaffUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailTaken) {
        throw new ConflictException('Email already in use');
      }
    }

    const data: any = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      doctorId: dto.doctorId !== undefined ? dto.doctorId : existing.doctorId,
    };

    if (dto.password && dto.password.trim().length >= 6) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        doctorId: true,
        createdAt: true,
      },
    });
  }

  async deleteStaffUser(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    if (existing.email === 'admin@doctorpro.com') {
      throw new BadRequestException('The primary administrator account cannot be deleted');
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
