import { Module } from '@nestjs/common';
import { CoachesModule } from '../coaches/coaches.module';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [CoachesModule],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class AuthModule {}