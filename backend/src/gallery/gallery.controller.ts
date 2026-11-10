import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto, UpdateGalleryDto } from './dto/gallery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGalleryDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateGalleryDto) {
    return this.galleryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
