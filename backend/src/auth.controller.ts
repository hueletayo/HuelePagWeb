import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
  HttpException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "./prisma.service";
import * as bcrypt from "bcryptjs";

function sanitize(athlete: any) {
  const { password, ...safe } = athlete;
  return safe;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Post("register")
  async register(@Body() body: any) {
    const { cedula, nombre, email, password, referenciaPago } = body;
    if (!cedula || !nombre || !email || !password || !referenciaPago) {
      throw new BadRequestException(
        "Todos los campos son requeridos, incluyendo la referencia de pago",
      );
    }
    if (String(password).length < 6) {
      throw new BadRequestException("La contrasena debe tener al menos 6 caracteres");
    }

    const existing = await this.prisma.athlete.findFirst({
      where: { OR: [{ email }, { cedula }] },
    });
    if (existing) {
      throw new BadRequestException("El email o la cedula ya estan registrados");
    }

    const hashed = await bcrypt.hash(password, 10);
    const atleta = await this.prisma.athlete.create({
      data: {
        cedula,
        nombre,
        email,
        password: hashed,
        referenciaRegistro: referenciaPago,
        estado: "EN_REVISION",
        // El rol NUNCA sale del body: si no, cualquiera se registra como ADMIN
        role: "USER",
      },
    });

    // Sin token: la cuenta aun no esta aprobada, no debe poder llamar a nada
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

    if (atleta.estado === "EN_REVISION") {
      throw new HttpException(
        {
          success: false,
          pendingReview: true,
          message:
            "Tu cuenta esta en revision. En cuanto Administracion verifique tu pago, podras entrar.",
        },
        403,
      );
    }

    // El token firmado es ahora la unica credencial que acepta la API
    const token = await this.jwt.signAsync({
      sub: atleta.id,
      role: atleta.role,
    });

    return { success: true, token, data: sanitize(atleta) };
  }
}
