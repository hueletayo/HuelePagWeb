import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly sheetsService: GoogleSheetsService) {}

  @Post('login')
  async login(@Body('cedula') cedula: string) {
    if (!cedula) {
      throw new UnauthorizedException('Cédula es requerida');
    }

    const atleta = await this.sheetsService.getAthleteByCedula(cedula);
    
    if (!atleta) {
      throw new UnauthorizedException('Cédula no encontrada en el sistema');
    }

    return {
      success: true,
      data: atleta
    };
  }
}
