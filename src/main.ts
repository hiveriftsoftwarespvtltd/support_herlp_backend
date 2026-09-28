import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Serve static uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  const rawOrigins =
    configService.get<string>('ALLOWED_ORIGINS') ||
    configService.get<string>('CORS_ORIGIN') ||
    '';

  const configuredOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaultOrigins = [
    'https://supporthelp.online',
    'http://supporthelp.online',
    'https://www.supporthelp.online',
    'http://www.supporthelp.online',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  const allowedOriginsSet = new Set([...defaultOrigins, ...configuredOrigins]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      if (
        allowedOriginsSet.has(normalizedOrigin) ||
        /^https?:\/\/([a-z0-9-]+\.)?supporthelp\.online$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port);
  console.log(`🚀 Support Help Backend Server running on: http://localhost:${port}`);
}

bootstrap();
