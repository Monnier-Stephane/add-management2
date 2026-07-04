import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getFirebaseAdmin } from './auth/firebase-admin';

export function getCorsOrigins(): string[] {
  const origins = new Set<string>([
    'https://add-management2.vercel.app',
    'https://add-management2-lkuaczyow-monnier-stehanes-projects.vercel.app',
    'https://add-management2-1wiqxd2x6-monnier-stehanes-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ]);

  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
  if (frontendUrl) {
    origins.add(frontendUrl);
  }

  return [...origins];
}

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  getFirebaseAdmin();
  console.log('Firebase Admin initialisé');

  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cache-Control',
      'Pragma',
      'X-Requested-With',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}
if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
