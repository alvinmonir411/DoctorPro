import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string; publicId?: string }> {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret && file.buffer) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = 'doctorpro';
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = createHash('sha1').update(paramsToSign).digest('hex');

      const form = new FormData();
      const uint8 = new Uint8Array(file.buffer);
      form.append(
        'file',
        new Blob([uint8], { type: file.mimetype || 'application/octet-stream' }),
        file.originalname || 'upload',
      );
      form.append('folder', folder);
      form.append('timestamp', String(timestamp));
      form.append('api_key', apiKey);
      form.append('signature', signature);

      let response: Response;
      try {
        response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: form,
        });
      } catch (networkErr: any) {
        throw new BadRequestException(
          `Cloudinary network error: ${networkErr?.message || 'Unable to connect to Cloudinary'}`,
        );
      }

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        const cloudinaryMsg =
          data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new BadRequestException(`Cloudinary error: ${cloudinaryMsg}`);
      }

      return {
        url: data.secure_url,
        publicId: data.public_id,
      };
    }

    // Fallback to local storage if Cloudinary env vars are missing
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    const fullPath = join(uploadDir, filename);
    writeFileSync(fullPath, file.buffer);

    return {
      url: `/uploads/${filename}`,
    };
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
