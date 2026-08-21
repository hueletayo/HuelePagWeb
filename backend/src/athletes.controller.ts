import { Controller, Get, Put, Body, Param, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('athletes')
export class AthletesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllAthletes() {
    const athletes = await this.prisma.athlete.findMany({
      orderBy: { nombre: 'asc' }
    });
    return { success: true, data: athletes };
  }

  @Put(':id/pago')
  async updatePago(@Param('id') id: string, @Body('ultimoPago') ultimoPago: string, @Body('estado') estado: string) {
    const athlete = await this.prisma.athlete.update({
      where: { id: parseInt(id) },
      data: { ultimoPago, estado }
    });
    return { success: true, data: athlete };
  }

  @Put(':id/perfil')
  async completarPerfil(@Param('id') id: string, @Body() body: any) {
    const { telefono, instagram, direccion, contactoEmergencia, condicionMedica, lesiones, operaciones } = body;
    
    const athlete = await this.prisma.athlete.update({
      where: { id: parseInt(id) },
      data: { 
        telefono, 
        instagram, 
        direccion, 
        contactoEmergencia, 
        condicionMedica, 
        lesiones, 
        operaciones,
        perfilCompletado: true
      }
    });
    return { success: true, data: athlete };
  }
}
