import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

const fileUploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|pdf)$/)) {
      return cb(new BadRequestException('Only image (JPG, PNG, WEBP) and PDF files are allowed!'), false);
    }
    cb(null, true);
  },
};

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', fileUploadOptions))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const uploaded = await this.uploadService.uploadFile(file);
    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Public()
  @Post('public')
  @UseInterceptors(FileInterceptor('file', fileUploadOptions))
  async uploadPublicFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const uploaded = await this.uploadService.uploadFile(file);
    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
