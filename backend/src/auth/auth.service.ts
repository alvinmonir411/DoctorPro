import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffUserDto, UpdateStaffUserDto } from './dto/user-management.dto';
import { DoctorRegisterDto, CreateAssistantDto } from './dto/doctor-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

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

    // Check account status
    if (user.status === 'PENDING_APPROVAL') {
      throw new ForbiddenException(
        'Your doctor registration is pending clinic administration approval. You will receive access once verified.',
      );
    }

    if (user.status === 'REJECTED') {
      throw new ForbiddenException(
        'Your registration was declined by clinic administration. Please contact the front desk.',
      );
    }

    let doctor: any = null;
    if (user.doctorId) {
      doctor = await this.prisma.doctor.findUnique({
        where: { id: user.doctorId },
        include: { department: true },
      });

      // If doctor role and doctor record is inactive
      if (user.role === 'DOCTOR' && doctor && !doctor.isActive) {
        throw new ForbiddenException(
          'Your doctor practice profile is currently deactivated or pending review by administration.',
        );
      }
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
        status: user.status,
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
        status: 'APPROVED',
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
        status: user.status,
        avatar: user.avatar,
      },
    };
  }

  // ─── Doctor Self-Registration (Pending Admin Approval) ───

  async registerDoctor(dto: DoctorRegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // Resolve or find Department
    let departmentId = dto.departmentId;
    const existingDept = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!existingDept) {
      // Find or create
      let dept = await this.prisma.department.findFirst({
        where: {
          OR: [{ slug: this.generateSlug(departmentId) }, { name: departmentId }],
        },
      });
      if (!dept) {
        dept = await this.prisma.department.create({
          data: {
            name: departmentId,
            slug: this.generateSlug(departmentId) || 'general-medicine',
          },
        });
      }
      departmentId = dept.id;
    }

    // Generate unique slug
    let baseSlug = this.generateSlug(dto.name);
    if (!baseSlug) baseSlug = 'doctor-' + Date.now();
    let slug = baseSlug;
    let count = 1;
    while (await this.prisma.doctor.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create Doctor record with isActive = false (pending review)
    const doctor = await this.prisma.doctor.create({
      data: {
        name: dto.name,
        title: dto.title || 'MBBS, FCPS',
        slug,
        specialization: dto.specialization,
        departmentId,
        bio: dto.bio || null,
        image: dto.image || null,
        certificate: dto.certificate || null,
        slotDuration: dto.slotDuration ? Number(dto.slotDuration) : 30,
        autoApprove: Boolean(dto.autoApprove),
        appointmentStartTime: dto.appointmentStartTime || '09:00',
        appointmentEndTime: dto.appointmentEndTime || '17:00',
        maxDailyPatients: dto.maxDailyPatients ? Number(dto.maxDailyPatients) : 20,
        experienceYears: dto.experienceYears ? Number(dto.experienceYears) : 5,
        chamberAddress: dto.chamberAddress || 'DoctorPro Medical Center, New York, NY',
        phone: dto.phone || null,
        email: dto.email,
        consultationFee: dto.consultationFee ? Number(dto.consultationFee) : 1000,
        isActive: false, // Inactive until admin approves
        schedules: {
          create: [
            { dayOfWeek: 6, startTime: dto.appointmentStartTime || '09:00', endTime: dto.appointmentEndTime || '17:00', maxPatients: dto.maxDailyPatients ? Number(dto.maxDailyPatients) : 20 },
            { dayOfWeek: 0, startTime: dto.appointmentStartTime || '09:00', endTime: dto.appointmentEndTime || '17:00', maxPatients: dto.maxDailyPatients ? Number(dto.maxDailyPatients) : 20 },
            { dayOfWeek: 1, startTime: dto.appointmentStartTime || '09:00', endTime: dto.appointmentEndTime || '17:00', maxPatients: dto.maxDailyPatients ? Number(dto.maxDailyPatients) : 20 },
            { dayOfWeek: 2, startTime: dto.appointmentStartTime || '09:00', endTime: dto.appointmentEndTime || '17:00', maxPatients: dto.maxDailyPatients ? Number(dto.maxDailyPatients) : 20 },
            { dayOfWeek: 3, startTime: dto.appointmentStartTime || '09:00', endTime: dto.appointmentEndTime || '17:00', maxPatients: dto.maxDailyPatients ? Number(dto.maxDailyPatients) : 20 },
            { dayOfWeek: 4, startTime: dto.appointmentStartTime || '09:00', endTime: dto.appointmentEndTime || '17:00', maxPatients: dto.maxDailyPatients ? Number(dto.maxDailyPatients) : 20 },
          ],
        },
      },
      include: { department: true },
    });

    // Create User record with PENDING_APPROVAL
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        password: hashedPassword,
        role: 'DOCTOR',
        status: 'PENDING_APPROVAL',
        doctorId: doctor.id,
        avatar: dto.image || null,
      },
    });

    return {
      success: true,
      message:
        'Doctor registration submitted successfully! Your profile and credentials are now under review. You will be able to log in once approved by clinic administration.',
      doctor: {
        id: doctor.id,
        name: doctor.name,
        slug: doctor.slug,
        email: doctor.email,
      },
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
    };
  }

  // ─── Admin Doctor Approval Workflow ───

  async approveDoctor(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor record not found');
    }

    // Activate doctor
    const updatedDoctor = await this.prisma.doctor.update({
      where: { id: doctorId },
      data: { isActive: true },
    });

    // Activate linked user(s)
    await this.prisma.user.updateMany({
      where: { doctorId },
      data: { status: 'APPROVED' },
    });

    return {
      success: true,
      message: `Dr. ${doctor.name} has been approved and activated successfully. They can now log in.`,
      doctor: updatedDoctor,
    };
  }

  async rejectDoctor(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor record not found');
    }

    // Deactivate doctor
    await this.prisma.doctor.update({
      where: { id: doctorId },
      data: { isActive: false },
    });

    // Set user status to REJECTED
    await this.prisma.user.updateMany({
      where: { doctorId },
      data: { status: 'REJECTED' },
    });

    return {
      success: true,
      message: `Dr. ${doctor.name}'s registration has been rejected.`,
    };
  }

  // ─── Doctor's Assistant Management (Doctor can add & manage her assistants) ───

  async getDoctorAssistants(doctorId: string) {
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    return this.prisma.user.findMany({
      where: {
        doctorId,
        role: 'DOCTOR_ASSISTANT',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        doctorId: true,
        createdAt: true,
      },
    });
  }

  async createDoctorAssistant(doctorId: string, dto: CreateAssistantDto) {
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A user account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        role: 'DOCTOR_ASSISTANT',
        status: 'APPROVED',
        doctorId: doctor.id,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        doctorId: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: `Assistant ${user.name} added successfully for Dr. ${doctor.name}.`,
      assistant: user,
    };
  }

  async deleteDoctorAssistant(doctorId: string, assistantId: string) {
    const assistant = await this.prisma.user.findFirst({
      where: {
        id: assistantId,
        doctorId,
        role: 'DOCTOR_ASSISTANT',
      },
    });

    if (!assistant) {
      throw new NotFoundException('Assistant account not found for this doctor.');
    }

    await this.prisma.user.delete({
      where: { id: assistantId },
    });

    return {
      success: true,
      message: 'Assistant account removed successfully.',
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
        status: true,
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
        include: { department: true, schedules: true },
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
        status: true,
        avatar: true,
        doctorId: true,
        createdAt: true,
      },
    });

    // Populate doctor details for each user
    const doctors = await this.prisma.doctor.findMany({
      select: {
        id: true,
        name: true,
        specialization: true,
        image: true,
        certificate: true,
        isActive: true,
        slotDuration: true,
        autoApprove: true,
      },
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
        status: 'APPROVED',
        doctorId: dto.doctorId || null,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
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
        status: true,
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
