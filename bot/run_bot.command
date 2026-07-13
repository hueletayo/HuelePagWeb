#!/bin/bash
# Script para iniciar el Bot en Mac (Hacer doble clic)
cd "$(dirname "$0")"

echo "=========================================="
echo "🥊 INICIANDO BOT DE 3ER ROUND FIT 🥊"
echo "=========================================="
echo "Asegurate de que la Mac tenga internet."
echo "Abriendo el sistema..."

# Ejecutar el bot
node index.js

# Mantener la ventana abierta si hay un error
read -p "Presiona Enter para cerrar esta ventana..."
