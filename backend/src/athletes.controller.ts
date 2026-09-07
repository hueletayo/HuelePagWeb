import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { JwtAuthGuard, AdminGuard, CurrentUser, SessionUser } from "./auth.guard";

function sanitize(athlete: any) {
  const { password, ...safe } = athlete;
  return safe;
}

/** El admin puede ver a cualquiera; un atleta solo a si mismo. */
function assertPuedeVer(user: SessionUser, targetId: number) {
  if (user.role === "ADMIN") return;
  if (user.id !== targetId) throw new ForbiddenException("No autorizado");
}

function parseId(id: string): number {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestException("Id invalido");
  return n;
}

@Controller()
export class AthletesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("ping")
  ping() {
    return { status: "ok" };
  }

  @Get("athletes/:id")
  @UseGuards(JwtAuthGuard)
  async getAthlete(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    const numId = parseId(id);
    assertPuedeVer(user, numId);

    const atleta = await this.prisma.athlete.findUnique({ where: { id: numId } });
    if (!atleta) throw new NotFoundException("Atleta no encontrado");
    return { success: true, data: sanitize(atleta) };
  }

  @Get("athletes")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllAthletes() {
    const athletes = await this.prisma.athlete.findMany({ orderBy: { nombre: "asc" } });
    return { success: true, data: athletes.map(sanitize) };
  }

  @Put("athletes/:id/pago")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updatePago(
    @Param("id") id: string,
    @Body("ultimoPago") ultimoPago: string,
    @Body("estado") estado: string,
  ) {
    const hoy = new Date();
    const computedUltimoPago =
      ultimoPago ||
      hoy.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

    const athlete = await this.prisma.athlete.update({
      where: { id: parseId(id) },
      data: { ultimoPago: computedUltimoPago, estado: estado || "VIGENTE" },
    });
    return { success: true, data: sanitize(athlete) };
  }

  @Put("athletes/:id/perfil")
  @UseGuards(JwtAuthGuard)
  async completarPerfil(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: any,
  ) {
    const numId = parseId(id);
    // El perfil de salud solo lo edita su dueno, ni siquiera el admin
    if (user.id !== numId) throw new ForbiddenException("No autorizado");

    const {
      telefono,
      instagram,
      direccion,
      contactoEmergencia,
      condicionMedica,
      lesiones,
      operaciones,
    } = body;

    const athlete = await this.prisma.athlete.update({
      where: { id: numId },
      data: {
        telefono,
        instagram,
        direccion,
        contactoEmergencia,
        condicionMedica,
        lesiones,
        operaciones,
        perfilCompletado: true,
      },
    });
    return { success: true, data: sanitize(athlete) };
  }

  @Put("athletes/:id/aprobar")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async aprobar(@Param("id") id: string) {
    const athlete = await this.prisma.athlete.update({
      where: { id: parseId(id) },
      data: { estado: "PENDIENTE" },
    });
    return { success: true, data: sanitize(athlete) };
  }

  @Delete("athletes/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async eliminar(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    const numId = parseId(id);
    if (numId === user.id) {
      throw new BadRequestException("No puedes eliminar tu propia cuenta de administrador");
    }

    const objetivo = await this.prisma.athlete.findUnique({ where: { id: numId } });
    if (!objetivo) throw new NotFoundException("Atleta no encontrado");
    if (objetivo.role === "ADMIN") {
      throw new ForbiddenException("No se puede eliminar a otro administrador");
    }

    await this.prisma.athlete.delete({ where: { id: numId } });
    return { success: true };
  }
}
