import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';
import { AthletesController } from './athletes.controller';

@Module({
  imports: [],
  controllers: [AppController, AuthController, AthletesController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
