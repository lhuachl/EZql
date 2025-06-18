import 'reflect-metadata';
import { SimpleEZqlClient as EZqlClient, ConnectionConfig } from './simple-client';
import { EZqlApplication } from './scr/web/application';
import { TaskController } from './scr/web/controllers/task.controller';

async function main() {
  console.log('🔐 Configurando EZql Framework...');

  // === CONFIGURACIÓN DE BASE DE DATOS ===
  const config: ConnectionConfig = {
    server: 'localhost',
    database: 'pylonbaytest',
    username: 'ezql_user',
    password: 'EzqlPass123!',
    port: 1433,
    encrypt: false,
    trustServerCertificate: true
  };
  
  // Crear cliente EZql y conectar
  const dbClient = EZqlClient.create(config);
  await dbClient.connect();
  console.log('✅ Conectado a SQL Server');

  // === CONFIGURACIÓN DE APLICACIÓN ===
  const app = new EZqlApplication({
    port: 3001,
    host: 'localhost',
    cors: { origin: '*', credentials: false },
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'EZql Framework API Demo',
      version: '1.0.0',
      description: 'Demo mostrando decoradores HTTP y métodos tradicionales'
    }
  });

  // Configurar el cliente de base de datos en la aplicación
  app.setDbClient(dbClient);
  console.log('✅ Aplicación EZql creada');

  // === OPCIÓN 1: USANDO DECORADORES (Recomendado) ===
  console.log('📋 Registrando controladores con decoradores...');
  
  // Registrar el controlador de tareas que usa decoradores
  app.useController(TaskController);
  console.log('✅ TaskController registrado con decoradores');

  // === OPCIÓN 2: USANDO EXPRESS TRADICIONAL (Para flexibilidad) ===
  console.log('🔧 Registrando rutas tradicionales...');
  
  const expressApp = app.getExpressApp();

  // Endpoint de salud del sistema
  expressApp.get('/health', async (_req, res) => {
    try {
      const healthCheck = await dbClient.healthCheck();
      const stats = dbClient.getClientStats();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: healthCheck,
        client: stats,
        framework: 'EZql v1.0.0'
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: (e as Error).message
      });
    }
  });

  // Estadísticas de la aplicación
  expressApp.get('/stats', async (_req, res) => {
    try {
      const { sql, parameters } = dbClient
        .select('COUNT(*) as total')
        .from('Tasks')
        .build();
      
      const totalResult = await dbClient.execute(sql, parameters);
      const total = totalResult[0]?.total || 0;

      const { sql: completedSql, parameters: completedParams } = dbClient
        .select('COUNT(*) as completed')
        .from('Tasks')
        .where('completed', '=', true)
        .build();
      
      const completedResult = await dbClient.execute(completedSql, completedParams);
      const completed = completedResult[0]?.completed || 0;

      res.json({
        success: true,
        data: {
          total_tasks: total,
          completed_tasks: completed,
          pending_tasks: total - completed,
          completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
        }
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: (e as Error).message
      });
    }
  });

  // Bulk operations (operaciones en lote)
  expressApp.post('/tasks/bulk', async (req, res) => {
    try {
      const { tasks } = req.body;
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere un array de tareas'
        });
      }

      // Validar cada tarea
      for (const task of tasks) {
        if (!task.title) {
          return res.status(400).json({
            success: false,
            error: 'Cada tarea debe tener un título'
          });
        }
      }

      // Insertar múltiples tareas
      const tasksToInsert = tasks.map(task => ({
        title: task.title,
        description: task.description || null,
        completed: task.completed || false,
        created_at: new Date()
      }));

      const result = await dbClient
        .insert()
        .into('Tasks')
        .multipleRows(tasksToInsert)
        .execute();

      res.status(201).json({
        success: true,
        message: `${tasks.length} tareas creadas exitosamente`,
        data: result
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: (e as Error).message
      });
    }
  });

  // Endpoint para resetear datos de demo
  expressApp.post('/demo/reset', async (_req, res) => {
    try {
      // Eliminar todas las tareas
      const { sql: deleteSql, parameters: deleteParams } = dbClient
        .delete()
        .from('Tasks')
        .build();
      
      await dbClient.executeNonQuery(deleteSql, deleteParams);

      // Insertar datos de demo
      const demoTasks = [
        { title: 'Configurar EZql Framework', description: 'Establecer conexión con SQL Server', completed: true },
        { title: 'Implementar decoradores HTTP', description: 'Crear decoradores @Get, @Post, etc.', completed: true },
        { title: 'Crear API REST completa', description: 'Endpoints para CRUD de tareas', completed: false },
        { title: 'Documentar framework', description: 'Crear documentación y ejemplos', completed: false },
        { title: 'Optimizar query builder', description: 'Mejorar performance y características', completed: false }
      ];

      for (const task of demoTasks) {
        await dbClient
          .insert()
          .into('Tasks')
          .values({
            ...task,
            created_at: new Date()
          })
          .execute();
      }

      res.json({
        success: true,
        message: 'Datos de demo reseteados exitosamente',
        inserted: demoTasks.length
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: (e as Error).message
      });
    }
  });

  // === LEVANTAR SERVIDOR ===
  console.log('🚀 Iniciando servidor...');
  await app.listen();
  
  console.log('');
  console.log('🎉 ¡Servidor EZql ejecutándose exitosamente!');
  console.log('🌐 URL: http://localhost:3001');
  console.log('');
  console.log('📚 Endpoints disponibles:');
  console.log('');
  console.log('🔸 USANDO DECORADORES (TaskController):');
  console.log('   GET    /tasks              - Listar todas las tareas');
  console.log('   GET    /tasks/:id          - Obtener tarea por ID');
  console.log('   POST   /tasks              - Crear nueva tarea');
  console.log('   PUT    /tasks/:id          - Actualizar tarea');
  console.log('   DELETE /tasks/:id          - Eliminar tarea');
  console.log('   GET    /tasks/search       - Buscar tareas');
  console.log('   GET    /tasks/completed/:status - Filtrar por estado');
  console.log('');
  console.log('🔸 USANDO EXPRESS TRADICIONAL:');
  console.log('   GET    /health             - Estado del sistema');
  console.log('   GET    /stats              - Estadísticas de tareas');
  console.log('   POST   /tasks/bulk         - Crear múltiples tareas');
  console.log('   POST   /demo/reset         - Resetear datos de demo');
  console.log('');
  console.log('📖 DOCUMENTACIÓN:');
  console.log('   GET    /docs               - Swagger/OpenAPI docs');
  console.log('');
  console.log('💡 Ejemplos de uso:');
  console.log('   curl http://localhost:3001/tasks');
  console.log('   curl http://localhost:3001/health');
  console.log('   curl -X POST http://localhost:3001/demo/reset');
}

main().catch(err => {
  console.error('❌ Error al iniciar EZql Framework:', err);
  process.exit(1);
});
