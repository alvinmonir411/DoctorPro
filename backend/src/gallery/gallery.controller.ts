import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto, UpdateGalleryDto } from './dto/gallery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { assertAdminRole } from '../common/utils/doctor-scope';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGalleryDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.galleryService.create(dto);
  }

  @Public()
  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.galleryService.findAll(category, activeOnly === 'true');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateGalleryDto, @Req() req: any) {
    assertAdminRole(req.user);
    return this.galleryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    assertAdminRole(req.user);
    return this.galleryService.remove(id);
  }
}
