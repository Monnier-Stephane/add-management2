import './instrument'; // ← En premier
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS pour autoriser le frontend Vercel
  app.enableCors({
    origin: [
      'https://add-management2.vercel.app',
      'https://add-management2-lkuaczyow-monnier-stehanes-projects.vercel.app',
      'https://add-management2-1wiqxd2x6-monnier-stehanes-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
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

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
