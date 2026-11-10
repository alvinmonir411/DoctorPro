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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateStaffUserDto, UpdateStaffUserDto } from './dto/user-management.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  // ─── Staff & Users Management (Admin, Doctor, Doctor Assistant) ───

  @UseGuards(JwtAuthGuard)
  @Get('staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all staff users (Admin, Doctor, Doctor Assistant)' })
  async getStaffUsers() {
    return this.authService.getStaffUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Post('staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new staff user (Admin, Doctor, Doctor Assistant)' })
  async createStaffUser(@Body() dto: CreateStaffUserDto) {
    return this.authService.createStaffUser(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('staff/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a staff user' })
  async updateStaffUser(
    @Param('id') id: string,
    @Body() dto: UpdateStaffUserDto,
  ) {
    return this.authService.updateStaffUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('staff/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a staff user' })
  async deleteStaffUser(@Param('id') id: string) {
    return this.authService.deleteStaffUser(id);
  }
}
