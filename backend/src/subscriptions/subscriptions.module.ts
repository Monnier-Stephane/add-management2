import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { SubscriptionsService } from './subscriptions.service';
import { CsvProcessorService } from './csv-processor.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    MulterModule.register({
      storage: undefined,
    }),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, CsvProcessorService],
  exports: [SubscriptionsService, CsvProcessorService],
})
export class SubscriptionsModule {} 