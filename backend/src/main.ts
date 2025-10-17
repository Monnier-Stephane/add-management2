import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('🔧 Initializing Sentry...');
  console.log('🔧 SENTRY_DSN:', process.env.SENTRY_DSN ? 'Set' : 'Not set');

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });

  console.log('✅ Sentry initialized');
  
  // Configuration CORS pour autoriser le frontend Vercel
  app.enableCors({
    origin: [
      'https://add-management2.vercel.app',
      'https://add-management2-lkuaczyow-monnier-stehanes-projects.vercel.app',
      'https://add-management2-1wiqxd2x6-monnier-stehanes-projects.vercel.app',
      'http://localhost:3000', // Pour le développement local
      'http://localhost:3001'  // Pour le développement local
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
  });
  
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();