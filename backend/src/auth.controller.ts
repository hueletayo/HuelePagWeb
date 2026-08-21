import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('register')
  async register(@Body() body: any) {
    const { cedula, nombre, email, password } = body;
    if (!cedula || !nombre || !email || !password) {
      throw new BadRequestException('Todos los campos son requeridos');
    }

    const existingUser = await this.prisma.athlete.findFirst({
      where: { OR: [{ email }, { cedula }] }
    });

    if (existingUser) {
      throw new BadRequestException('El usuario o la cédula ya están registrados');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const atleta = await this.prisma.athlete.create({
      data: {
        cedula,
        nombre,
        email,
        password: hashedPassword
      }
    });

    const { password: _, ...result } = atleta;
    return { success: true, data: result };
  }

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    if (!email || !password) {
      throw new UnauthorizedException('Email y contraseña son requeridos');
    }

    const atleta = await this.prisma.athlete.findUnique({
      where: { email }
    });
    
    if (!atleta) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, atleta.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password: _, ...result } = atleta;
    return {
      success: true,
      data: result
    };
  }
}
