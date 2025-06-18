import 'reflect-metadata';
import { SimpleEZqlClient as EZqlClient, ConnectionConfig } from './simple-client';
import { EZqlApplication } from './scr/web/application';
import { TaskController } from './scr/web/controllers/task.controller';

async function main() {
  console.log('🔐 Configurando SQL Server Authentication');
  
  // Configuración de conexión
  const config: ConnectionConfig = {
    server: 'localhost',
    database: 'pylonbaytest',
    username: 'ezql_user',
    password: 'EzqlPass123!',
    port: 1433,
    encrypt: false,
    trustServerCertificate: true
  };
  
  // Crear cliente y conectar
  const dbClient = EZqlClient.create(config);
  await dbClient.connect();
  console.log('✅ Conectado a SQL Server');

  // Crear aplicación EZql
  const app = new EZqlApplication({
    port: 3001,
    host: 'localhost',
    cors: { origin: '*', credentials: false },
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'Tasks API Documentation',
      version: '1.0.0',
      description: 'API REST para gestión de tareas usando EZql framework'
    }
  });
  console.log('✅ Aplicación EZql creada');
  // Registrar el controlador de tareas con decoradores
  try {
    app.useController(TaskController);
    console.log('✅ Controlador de tareas registrado');
  } catch (error) {
    console.error('❌ Error al registrar controlador:', error);
    throw error;
  }

  // Ruta de estado del servidor
  const expressApp = app.getExpressApp();
  expressApp.get('/health', async (_req, res) => {
    try {
      const health = await dbClient.healthCheck();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: health,
        framework: 'EZql v1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      });
    }
  });

  // Levantar servidor
  console.log('📋 Levantando servidor HTTP...');
  await app.listen();
  console.log('🚀 Servidor corriendo en http://localhost:3001');
  console.log('');
  console.log('📚 Endpoints disponibles:');
  console.log('   GET    /health             - Estado del servidor');
  console.log('   GET    /tasks              - Listar todas las tareas');
  console.log('   GET    /tasks/:id          - Obtener tarea por ID');
  console.log('   POST   /tasks              - Crear nueva tarea');
  console.log('   PUT    /tasks/:id          - Actualizar tarea');
  console.log('   DELETE /tasks/:id          - Eliminar tarea');
  console.log('   GET    /tasks/completed/:status - Filtrar por estado');
  console.log('   GET    /tasks/search?q=texto   - Buscar tareas');
  console.log('   GET    /docs               - Documentación API');
  console.log('');
  console.log('🎯 Ejemplos de uso:');
  console.log('   curl http://localhost:3001/tasks');
  console.log('   curl -X POST http://localhost:3001/tasks -H "Content-Type: application/json" -d \'{"title":"Nueva tarea"}\'');
  console.log('   curl http://localhost:3001/tasks/search?q=configurar');
  console.log('   curl http://localhost:3001/tasks/completed/true');
}

main().catch(err => {
  console.error('❌ Error al iniciar la API:', err);
  process.exit(1);
});
