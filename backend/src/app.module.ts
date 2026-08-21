import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleSheetsService } from './google-sheets.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [],
  controllers: [AppController, AuthController],
  providers: [AppService, GoogleSheetsService],
})
export class AppModule {}
