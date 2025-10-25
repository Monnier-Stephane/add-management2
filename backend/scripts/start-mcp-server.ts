#!/usr/bin/env node
import { exec } from 'child_process';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement avec gestion d'erreur
try {
  dotenv.config();
} catch (error) {
  console.warn('Fichier .env non trouvé, utilisation des variables système');
  console.error('Erreur:', error);
}

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/add-management';

// Validation basique de l'URI
if (
  !MONGODB_URI.startsWith('mongodb://') &&
  !MONGODB_URI.startsWith('mongodb+srv://')
) {
  console.error('URI MongoDB invalide:', MONGODB_URI);
  process.exit(1);
}

console.log('Démarrage du serveur MCP MongoDB...');
console.log('URI MongoDB:', MONGODB_URI.replace(/\/\/.*@/, '//***@')); // Masquer les credentials

// Démarrer le serveur MCP MongoDB
const command = `npx -y mcp-mongo-server "${MONGODB_URI}" --read-only`;
console.log('Commande:', command);

const mcpServer = exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Erreur lors du démarrage du serveur MCP:', error);
    return;
  }
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  if (stdout) {
    console.log('Stdout:', stdout);
  }
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('Arrêt du serveur MCP...');
  if (mcpServer) {
    mcpServer.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Arrêt du serveur MCP...');
  if (mcpServer) {
    mcpServer.kill('SIGTERM');
  }
  process.exit(0);
});
