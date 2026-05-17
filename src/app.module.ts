import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardGateway  } from '@/dashboard/dashboard.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DashboardGateway],
})
export class AppModule {}
