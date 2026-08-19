import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private doc: GoogleSpreadsheet;
  private readonly sheetId = '1LE3XVzx8n4eGwpEYf10arN5hCWKnz1iBJLMCembljjs';
  
  // Sistema de Caché para evitar límites de API de Google
  private cachedRows: any[] = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

  async onModuleInit() {
    await this.initGoogleSheets();
  }

  private async initGoogleSheets() {
    try {
      let credentials: any;
      const credsPath = path.join(process.cwd(), '..', 'bot', 'credentials.json');
      
      if (fs.existsSync(credsPath)) {
        credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      } else {
        credentials = {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };
      }

      const auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.doc = new GoogleSpreadsheet(this.sheetId, auth);
      await this.doc.loadInfo();
      console.log(`[GoogleSheetsService] Conectado a DB: ${this.doc.title}`);
    } catch (error) {
      console.error('[GoogleSheetsService] Error conectando a Sheets:', error);
    }
  }

  // Refrescar caché manualmente si es necesario
  async forceRefreshCache() {
    if (!this.doc) return;
    const sheet = this.doc.sheetsByIndex[0]; // Asume que Grey pondrá la pestaña "SISTEMA" de primera
    this.cachedRows = await sheet.getRows();
    this.lastFetchTime = Date.now();
    console.log('[GoogleSheetsService] Caché actualizada directamente desde Google Sheets.');
  }

  async getAthleteByCedula(cedula: string) {
    if (!this.doc) return null;
    
    const now = Date.now();
    // Si la caché no existe o ya pasaron 5 minutos, vamos a Google
    if (!this.cachedRows || (now - this.lastFetchTime) > this.CACHE_TTL) {
      await this.forceRefreshCache();
    }
    
    const targetRow = this.cachedRows.find(row => {
      const rowCedula = row.get('Cedula') || row.get('Cédula') || '';
      return rowCedula.toString().trim() === cedula.toString().trim();
    });

    if (!targetRow) return null;

    const ultimoPagoStr = targetRow.get('Ultimo Pago') || targetRow.get('Fecha de Último Pago') || '';
    
    // Cálculo de Estatus Automático
    let estadoDinamico = 'VENCIDO';
    let diasTranscurridos = 999;
    
    if (ultimoPagoStr) {
      const parts = ultimoPagoStr.split('/');
      if (parts.length === 3) {
        const fechaUltimoPago = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const diffTime = new Date().getTime() - fechaUltimoPago.getTime();
        diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diasTranscurridos < 30) {
          estadoDinamico = 'VIGENTE';
        }
      }
    }

    // Verificar si la contraseña coincide (si Grey usa el teléfono como clave)
    // El frontend nos enviará la clave en el futuro, por ahora retornamos los datos
    return {
      nombre: targetRow.get('Nombre') || targetRow.get('Nombre y Apellido'),
      telefono: targetRow.get('Telefono') || targetRow.get('Teléfono'),
      estado: estadoDinamico,
      diasTranscurridos: diasTranscurridos,
      ultimoPago: ultimoPagoStr || '--/--/----'
    };
  }
}
