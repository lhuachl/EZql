import 'reflect-metadata';
import express from 'express'; // usado internamente por EZqlApplication
import { SimpleEZqlClient as EZqlClient, ConnectionConfig } from './simple-client';
import { EZqlApplication } from './scr/web/application';

async function main() {
  // Configuración simplificada con SQL Server Authentication
  const config: ConnectionConfig = {
    server: 'localhost',           // Servidor SQL Server
    database: 'pylonbaytest',      // Base de datos
    username: 'ezql_user',         // SQL login creado
    password: 'EzqlPass123!',      // Contraseña del login
    port: 1433,                    // Puerto (1433 por defecto)
    encrypt: false,                // Sin encriptación para dev local
    trustServerCertificate: true   // Confiar en certificado para desarrollo
  };

  // Crear cliente y conectar
  const dbClient = EZqlClient.create(config);
  await dbClient.connect();
  console.log('✅ Conectado a SQL Server');

  // 3. Crear aplicación con EZqlApplication
  const app = new EZqlApplication({
    port: 3000,
    host: 'localhost',
    cors: { origin: '*', credentials: false },
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'Tasks API Documentation',
      version: '1.0.0'
    }
  });
  console.log('✅ Aplicación EZql creada');

  // 4. Registrar ruta usando el cliente EZql
  const expressApp = app.getExpressApp();
  expressApp.get('/tasks', async (_req, res) => {
    try {
      const rows = await dbClient.raw('SELECT * FROM Tasks');
      res.json(rows);
    } catch (e) {
      res.status(500).send((e as Error).message);
    }
  });

  // 5. Levantar servidor via EZqlApplication
  console.log('📋 Levantando servidor HTTP...');
  await app.listen();
  console.log('🚀 Servidor corriendo en http://localhost:3000/tasks');
}

main().catch(err => {
  console.error('❌ Error al iniciar la API:', err);
  process.exit(1);
});