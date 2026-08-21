import { Controller, Get, Put, Body, Param, Headers, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

function sanitize(athlete: any) {
  const { password, ...safe } = athlete;
  return safe;
}

async function requireAdmin(prisma: PrismaService, athleteId: string) {
  if (!athleteId) throw new ForbiddenException("No autorizado");
  const id = parseInt(athleteId);
  if (isNaN(id)) throw new ForbiddenException("No autorizado");
  const admin = await prisma.athlete.findUnique({ where: { id } });
  if (!admin || admin.role !== "ADMIN") throw new ForbiddenException("No autorizado");
}

@Controller()
export class AthletesController {
  constructor(private readonly prisma: PrismaService) {}

  // Keep-alive para UptimeRobot / Render free tier
  @Get("ping")
  ping() {
    return { status: "ok" };
  }

  // Datos frescos del atleta logueado para el dashboard
  @Get("athletes/:id")
  async getAthlete(@Param("id") id: string, @Headers("x-athlete-id") requesterId: string) {
    const numId = parseInt(id);
    const reqId = parseInt(requesterId);
    if (isNaN(numId) || isNaN(reqId) || numId !== reqId) {
      throw new ForbiddenException("No autorizado");
    }
    const atleta = await this.prisma.athlete.findUnique({ where: { id: numId } });
    if (!atleta) throw new NotFoundException("Atleta no encontrado");
    return { success: true, data: sanitize(atleta) };
  }

  // Todos los atletas — solo ADMIN
  @Get("athletes")
  async getAllAthletes(@Headers("x-athlete-id") athleteId: string) {
    await requireAdmin(this.prisma, athleteId);
    const athletes = await this.prisma.athlete.findMany({ orderBy: { nombre: "asc" } });
    return { success: true, data: athletes.map(sanitize) };
  }

  // Renovar pago — solo ADMIN
  @Put("athletes/:id/pago")
  async updatePago(
    @Param("id") id: string,
    @Body("ultimoPago") ultimoPago: string,
    @Body("estado") estado: string,
    @Headers("x-athlete-id") athleteId: string,
  ) {
    await requireAdmin(this.prisma, athleteId);
    const hoy = new Date();
    const computedUltimoPago = ultimoPago || hoy.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const athlete = await this.prisma.athlete.update({
      where: { id: parseInt(id) },
      data: { ultimoPago: computedUltimoPago, estado: estado || "VIGENTE" },
    });
    return { success: true, data: sanitize(athlete) };
  }

  // Completar perfil — el propio atleta
  @Put("athletes/:id/perfil")
  async completarPerfil(
    @Param("id") id: string,
    @Headers("x-athlete-id") requesterId: string,
    @Body() body: any,
  ) {
    const numId = parseInt(id);
    const reqId = parseInt(requesterId);
    if (isNaN(numId) || isNaN(reqId) || numId !== reqId) {
      throw new ForbiddenException("No autorizado");
    }
    const { telefono, instagram, direccion, contactoEmergencia, condicionMedica, lesiones, operaciones } = body;
    const athlete = await this.prisma.athlete.update({
      where: { id: numId },
      data: { telefono, instagram, direccion, contactoEmergencia, condicionMedica, lesiones, operaciones, perfilCompletado: true },
    });
    return { success: true, data: sanitize(athlete) };
  }
}
