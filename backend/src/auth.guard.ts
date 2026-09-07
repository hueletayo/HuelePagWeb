import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/** Lo que viaja firmado dentro del token. Nunca confiar en nada mas del cliente. */
export interface SessionUser {
  id: number;
  role: string;
}

/**
 * El secreto JWT es obligatorio. Si falta, la app NO arranca:
 * es preferible un deploy caido a uno que acepte tokens falsos.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET no esta definido o tiene menos de 32 caracteres. " +
        "Configuralo en las variables de entorno (Render > Environment).",
    );
  }
  return secret;
}

/**
 * Verifica la firma del token y deja el usuario en req.user.
 * Sustituye al header x-athlete-id, que era falsificable por cualquiera.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Sesion no valida. Inicia sesion de nuevo.");
    }

    try {
      const payload = await this.jwt.verifyAsync(header.slice(7));
      const id = Number(payload.sub);
      if (!Number.isInteger(id)) throw new Error("sub invalido");
      req.user = { id, role: String(payload.role || "USER") } as SessionUser;
      return true;
    } catch {
      throw new UnauthorizedException("Sesion expirada o invalida. Inicia sesion de nuevo.");
    }
  }
}

/** Debe ir SIEMPRE despues de JwtAuthGuard: lee el req.user que aquel deja. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user: SessionUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user || user.role !== "ADMIN") {
      throw new ForbiddenException("Solo administradores");
    }
    return true;
  }
}

/** @CurrentUser() en vez de leer headers a mano en cada endpoint. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
