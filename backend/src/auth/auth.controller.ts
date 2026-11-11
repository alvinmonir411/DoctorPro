import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffUserDto, UpdateStaffUserDto } from './dto/user-management.dto';
import { DoctorRegisterDto, CreateAssistantDto } from './dto/doctor-register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import {
  assertAdminRole,
  assertNotAssistantRole,
} from '../common/utils/doctor-scope';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new admin/staff account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('doctor-register')
  @ApiOperation({ summary: 'Doctor self-registration (subject to admin approval)' })
  async registerDoctor(@Body() dto: DoctorRegisterDto) {
    return this.authService.registerDoctor(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  // ─── Admin Doctor Approval ───

  @UseGuards(JwtAuthGuard)
  @Patch('approve-doctor/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve doctor registration (Admin)' })
  async approveDoctor(@Request() req: any, @Param('id') id: string) {
    assertAdminRole(req.user, 'Only clinic administrators can approve doctors.');
    return this.authService.approveDoctor(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reject-doctor/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject doctor registration (Admin)' })
  async rejectDoctor(@Request() req: any, @Param('id') id: string) {
    assertAdminRole(req.user, 'Only clinic administrators can reject doctors.');
    return this.authService.rejectDoctor(id);
  }

  // ─── Doctor Assistant Management (by the Doctor) ───

  private async resolveDoctorId(req: any): Promise<string> {
    assertNotAssistantRole(req.user, 'Assistants cannot manage assistant accounts.');
    if (req.user?.doctorId) return req.user.doctorId;
    const profile = await this.authService.getProfile(req.user.sub);
    if (profile?.doctorId) return profile.doctorId;
    throw new BadRequestException('Only registered doctors can manage assistant staff');
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-assistants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assistants for the logged-in doctor' })
  async getMyAssistants(@Request() req: any) {
    const doctorId = await this.resolveDoctorId(req);
    return this.authService.getDoctorAssistants(doctorId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('my-assistants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create assistant account for the logged-in doctor' })
  async createMyAssistant(@Request() req: any, @Body() dto: CreateAssistantDto) {
    const doctorId = await this.resolveDoctorId(req);
    return this.authService.createDoctorAssistant(doctorId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-assistants/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove assistant account' })
  async deleteMyAssistant(@Request() req: any, @Param('id') id: string) {
    const doctorId = await this.resolveDoctorId(req);
    return this.authService.deleteDoctorAssistant(doctorId, id);
  }

  // ─── Staff & Users Management (Admin only) ───

  @UseGuards(JwtAuthGuard)
  @Get('staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all staff users (Admin, Doctor, Doctor Assistant)' })
  async getStaffUsers(@Request() req: any) {
    assertAdminRole(req.user, 'Only clinic administrators can view staff accounts.');
    return this.authService.getStaffUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Post('staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new staff user (Admin, Doctor, Doctor Assistant)' })
  async createStaffUser(@Request() req: any, @Body() dto: CreateStaffUserDto) {
    assertAdminRole(req.user, 'Only clinic administrators can create staff accounts.');
    return this.authService.createStaffUser(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('staff/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a staff user' })
  async updateStaffUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStaffUserDto,
  ) {
    assertAdminRole(req.user, 'Only clinic administrators can update staff accounts.');
    return this.authService.updateStaffUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('staff/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a staff user' })
  async deleteStaffUser(@Request() req: any, @Param('id') id: string) {
    assertAdminRole(req.user, 'Only clinic administrators can delete staff accounts.');
    return this.authService.deleteStaffUser(id);
  }
}
