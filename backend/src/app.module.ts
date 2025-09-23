import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CoachesModule } from './coaches/coaches.module';
import { PlanningModule } from './planning/planning.module';

@Module({
  imports: [DatabaseModule, SubscriptionsModule, CoachesModule, PlanningModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
