import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Load .env manually so env vars (DATABASE_URL, CLOUDINARY_*, GEMINI_API_KEY) are always present
try {
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} catch {}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS across local development and deployed frontend origins
  const allowedOrigins = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  const registerOriginList = (raw?: string) => {
    if (!raw) return;
    for (const part of raw.split(',')) {
      const cleaned = part.trim().replace(/\/+$/, '');
      if (cleaned) allowedOrigins.add(cleaned);
    }
  };
  registerOriginList(process.env.FRONTEND_URL);
  registerOriginList(process.env.CORS_ORIGIN);
  if (process.env.VERCEL_URL) {
    allowedOrigins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    allowedOrigins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.has(normalized) ||
        /^https:\/\/doctorpro[a-z0-9-]*\.vercel\.app$/i.test(normalized)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger setup (local / explicit opt-in; skip bundling static assets on Vercel)
  if (!process.env.VERCEL || process.env.ENABLE_SWAGGER === 'true') {
    try {
      const config = new DocumentBuilder()
        .setTitle('DoctorPro API')
        .setDescription('DoctorPro Medical Website API Documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    } catch {}
  }

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`DoctorPro API running on port ${port}`);
}

bootstrap();
