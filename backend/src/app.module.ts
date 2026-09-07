import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';
import { AthletesController } from './athletes.controller';
import { getJwtSecret } from './auth.guard';

@Module({
  imports: [
    // getJwtSecret() lanza si falta JWT_SECRET: la app no arranca sin el.
    JwtModule.register({
      global: true,
      secret: getJwtSecret(),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AppController, AuthController, AthletesController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
