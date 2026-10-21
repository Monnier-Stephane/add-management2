import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TshirtStock, TshirtStockSchema } from './schemas/tshirt-stock.schema';
import { TshirtsService } from './tshirts.service';
import { TshirtsController } from './tshirts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TshirtStock.name, schema: TshirtStockSchema },
    ]),
  ],
  controllers: [TshirtsController],
  providers: [TshirtsService],
})
export class TshirtsModule {}