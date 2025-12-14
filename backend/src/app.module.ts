import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CoachesModule } from './coaches/coaches.module';
import { PlanningModule } from './planning/planning.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
// SentryModule retiré

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // SentryModule.forRoot(), ← Retiré
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      ttl: 300000,
      isGlobal: true,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    }),
    DatabaseModule,
    SubscriptionsModule,
    CoachesModule,
    PlanningModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}