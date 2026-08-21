import { Controller, Post, Body, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import * as bcrypt from "bcryptjs";

function sanitize(athlete: any) {
  const { password, ...safe } = athlete;
  return safe;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("register")
  async register(@Body() body: any) {
    const { cedula, nombre, email, password } = body;
    if (!cedula || !nombre || !email || !password) {
      throw new BadRequestException("Todos los campos son requeridos");
    }

    const existing = await this.prisma.athlete.findFirst({
      where: { OR: [{ email }, { cedula }] },
    });
    if (existing) {
      throw new BadRequestException("El email o la cedula ya estan registrados");
    }

    const hashed = await bcrypt.hash(password, 10);
    const atleta = await this.prisma.athlete.create({
      data: { cedula, nombre, email, password: hashed },
    });

    return { success: true, data: sanitize(atleta) };
  }

  @Post("login")
  async login(@Body() body: any) {
    const { email, password } = body;
    if (!email || !password) {
      throw new UnauthorizedException("Email y contrasena son requeridos");
    }

    const atleta = await this.prisma.athlete.findUnique({ where: { email } });
    if (!atleta) throw new UnauthorizedException("Credenciales invalidas");

    const match = await bcrypt.compare(password, atleta.password);
    if (!match) throw new UnauthorizedException("Credenciales invalidas");

    return { success: true, data: sanitize(atleta) };
  }
}
