const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// ==========================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// ==========================================
// 1. Pon aquí el ID de tu Google Sheet (lo sacas del link de arriba)
const GOOGLE_SHEET_ID = '1LE3XVzx8n4eGwpEYf10arN5hCWKnz1iBJLMCembljjs'; 

let doc;
try {
    const creds = require('./credentials.json'); // Tus claves de Google
    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);
} catch (error) {
    console.error('❌ ERROR: No se encontró el archivo credentials.json o está mal configurado.');
    console.error('Por favor lee las instrucciones para conectar Google Sheets.');
}

// ==========================================
// INICIALIZACIÓN DE WHATSAPP
// ==========================================
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    // Solución al error de WhatsApp Web: Forzar una versión estable
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

client.on('qr', (qr) => {
    console.log('--------------------------------------------------');
    console.log('🤖 ESCANEA ESTE CÓDIGO QR CON EL WHATSAPP DEL GYM:');
    console.log('--------------------------------------------------');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ ¡Bot de 3er Round Fit conectado y listo!');
    console.log('Iniciando verificación de cobros con Google Sheets...');
    verificarCobros(); 
});

// ==========================================
// AUTORESPONDEDOR (CHATBOT)
// ==========================================
client.on('message', async msg => {
    try {
        console.log(`📩 Mensaje recibido de ${msg.from}: "${msg.body}"`);
        
        const chat = await msg.getChat();
        if (chat.isGroup) {
            console.log('Es un grupo, ignorando...');
            return; 
        }

        const texto = msg.body ? msg.body.toLowerCase() : "";

        // Palabras clave de información
        if (texto.includes('info') || texto.includes('horario') || texto.includes('precio') || texto.includes('inscrip')) {
            const respuesta = `*¡Hola! Bienvenido a 3er Round Fit 🥊*\n\n` +
                              `Somos un centro de entrenamiento de Boxeo Técnico y Funcional.\n\n` +
                              `⏱️ *Nuestros Horarios:*\n` +
                              `- Lunes a Viernes: Mañanas (7:30am - 12:30pm) y Tardes (4:00pm - 8:00pm)\n` +
                              `- Sábados Especiales: 8:30am - 10:30am\n\n` +
                              `💰 *Mensualidad:* 60 Euros\n\n` +
                              `📝 Para inscribirte, por favor llena nuestro formulario de salud aquí: \n` +
                              `🔗 https://hueletayo.github.io/HuelePagWeb/inscripcion.html\n\n` +
                              `_Si tienes otra duda puntual, Daniel o Grey te responderán por aquí en breve._`;
            
            console.log('⏳ Intentando enviar respuesta automática...');
            await msg.reply(respuesta);
            console.log(`✅ Mensaje automático enviado exitosamente a: ${msg.from}`);
        }
    } catch (error) {
        console.log('❌ Error procesando el mensaje:', error);
    }
});

// ==========================================
// LÓGICA DE COBRANZA (GOOGLE SHEETS)
// ==========================================
async function verificarCobros() {
    if (!doc) return;

    const hoy = new Date();
    const diaDelMes = hoy.getDate();

    if ((diaDelMes >= 1 && diaDelMes <= 5) || diaDelMes === 15) {
        console.log(`Hoy es día ${diaDelMes}. Conectando a Google Sheets para leer clientes...`);
        
        try {
            await doc.loadInfo(); 
            const sheet = doc.sheetsByIndex[0]; // Lee la primera hoja del Excel
            const rows = await sheet.getRows();

            let cobrosEnviados = 0;

            rows.forEach(async (row) => {
                // El bot buscará la columna llamada "Estado" en tu Excel
                // Y solo le escribirá a los que digan "Pendiente" o "Moroso"
                const estado = row.get('Estado');
                if (estado && (estado.toLowerCase().includes('pendiente') || estado.toLowerCase().includes('moroso'))) {
                    
                    const telefono = row.get('Telefono'); // Columna Telefono
                    const nombre = row.get('Nombre'); // Columna Nombre

                    if (!telefono) return;

                    const chatId = `${telefono}@c.us`;
                    
                    let mensajeCobro = "";
                    if (diaDelMes === 15) {
                        mensajeCobro = `⚠️ *AVISO DE VENCIMIENTO - 3er Round Fit*\n\n` +
                                       `Hola ${nombre}, notamos en nuestro sistema que tu mensualidad aún se encuentra PENDIENTE de pago habiendo pasado 15 días del mes.\n\n` +
                                       `Por favor regulariza tu pago a la brevedad para poder seguir disfrutando de tus entrenamientos con nosotros.\n\n` +
                                       `_Si ya realizaste el pago en estos días, por favor envíanos tu comprobante por esta vía. ¡Muchas gracias!_ 🥊`;
                    } else {
                        mensajeCobro = `¡Buenos días, ${nombre}! 🥊\n\n` +
                                       `Se les recuerda el pago puntual de la mensualidad correspondiente a su fecha de pago.\n\n` +
                                       `Agradecemos a las personas que ya realizaron su pago.\n\n` +
                                       `_¡Muchas gracias y feliz día de entrenamiento!_`;
                    }
                    
                    try {
                        // CUIDADO EN PRODUCCIÓN: Quitar el comentario de abajo para enviar de verdad
                        // await client.sendMessage(chatId, mensajeCobro);
                        console.log(`[SIMULACIÓN] Mensaje de cobro que se enviaría a ${nombre} al número ${telefono}`);
                        cobrosEnviados++;
                    } catch (error) {
                        console.log(`No se pudo enviar mensaje a ${nombre}`);
                    }
                }
            });

            console.log(`Búsqueda terminada. Se detectaron ${cobrosEnviados} pagos pendientes hoy.`);
        } catch (error) {
            console.log('Error conectando a Google Sheets. Verifica tus claves o el ID del Excel.', error);
        }
    } else {
        console.log(`Hoy es el día ${diaDelMes}. Los cobros automáticos masivos se hacen del 1 al 5, y el recordatorio de atraso el día 15.`);
    }
}

// Programar tarea diaria a las 9:00 AM (Por si la Mac se queda prendida)
schedule.scheduleJob('0 9 * * *', function(){
  console.log('Ejecutando tarea programada de cobranza (9:00 AM)');
  verificarCobros();
});

client.initialize();
