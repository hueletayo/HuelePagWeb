@
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const schedule = require("node-schedule");
const fetch = require("node-fetch"); // Si tu Node es >18 puedes usar fetch nativo

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html"
    }
});

client.on("qr", (qr) => {
    console.log("🤖 ESCANEA ESTE CÓDIGO QR CON EL WHATSAPP DEL GYM:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("✅ ¡Bot conectado y listo con PostgreSQL!");
    verificarCobros(); 
});

client.on("message", async msg => {
    try {
        const chat = await msg.getChat();
        if (chat.isGroup) return; 

        const texto = msg.body ? msg.body.toLowerCase() : "";
        if (texto.includes("info") || texto.includes("horario") || texto.includes("precio")) {
            const respuesta = `*Bienvenidos a 3er Round Fit Boxing Club 🥊*\n` +
                              `📝 Para inscribirte, llena nuestro formulario de salud aquí: \n` +
                              `🔗 https://hueletayo.github.io/HuelePagWeb/registro.html`;
            await msg.reply(respuesta);
        }
    } catch (error) {}
});

async function verificarCobros() {
    console.log("Conectando a la API en Render...");
    const hoy = new Date();
    
    try {
        const response = await fetch("https://api-3erround.onrender.com/athletes");
        const data = await response.json();
        
        let cobrosEnviados = 0;

        for (const atleta of data.data) {
            const estado = atleta.estado ? atleta.estado.toLowerCase() : "";
            const telefono = atleta.telefono; 
            const nombre = atleta.nombre; 
            const fechaStr = atleta.ultimoPago; 

            if (!telefono || !estado || !fechaStr) continue;
            if (estado.includes("inactivo") || estado.includes("retirado")) continue;

            const parts = fechaStr.split("/");
            if (parts.length !== 3) continue;
            const fechaUltimoPago = new Date(parts[2], parts[1] - 1, parts[0]);
            
            const diffTime = hoy.getTime() - fechaUltimoPago.getTime();
            const diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let num = telefono.startsWith("0") ? "58" + telefono.substring(1) : telefono;
            const chatId = `${num}@c.us`;

            let mensajeCobro = "";
            if (diasTranscurridos === 30) {
                mensajeCobro = `🌟 *¡Hola ${nombre}!* Hoy se cumplen 30 días desde tu último pago...`;
            }

            if (mensajeCobro !== "") {
                console.log(`[SIMULACIÓN] Mensaje a ${nombre}: ${mensajeCobro.substring(0, 20)}...`);
                // await client.sendMessage(chatId, mensajeCobro);
            }
        }
    } catch (e) {
        console.log("Error API", e);
    }
}

schedule.scheduleJob("0 9 * * *", () => verificarCobros());
client.initialize();
@
