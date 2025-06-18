/**
 * EZql Framework - Test con EZqlApplication Simplificada
 * Demostración de la sintaxis intermedia: Express simplificado pero sin decoradores
 */

import { EZqlApplication } from './scr/web/application';
import { SimpleEZqlClient as EZqlClient, ConnectionConfig } from './simple-client';

async function main() {
  console.log('🚀 Iniciando EZql con sintaxis simplificada...');

  // ===== CONFIGURACIÓN =====
  
  const config: ConnectionConfig = {
    server: 'localhost',
    database: 'pylonbaytest',
    username: 'ezql_user',
    password: 'EzqlPass123!',
    port: 1433,
    encrypt: false,
    trustServerCertificate: true
  };

  // Crear cliente de base de datos
  const dbClient = EZqlClient.create(config);
  await dbClient.connect();
  console.log('✅ Conectado a SQL Server');

  // ===== CREAR APLICACIÓN EZQL (SINTAXIS SIMPLIFICADA) =====
  
  const app = new EZqlApplication({
    port: 3004,
    host: 'localhost',
    cors: { origin: '*', credentials: false },
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'EZql Framework - Sintaxis Simplificada',
      version: '1.0.0'
    }
  });

  // Configurar cliente de base de datos
  app.useEZql(dbClient);

  // ===== OBTENER EL ROUTER PARA RUTAS MANUALES =====
  
  const router = app.getRouter();
  const expressApp = app.getExpressApp();

  // ===== SINTAXIS SIMPLIFICADA CON EZQL =====

  // GET /simple/tasks - Listar todas las tareas
  router.get('/simple/tasks', async (req, res) => {
    console.log('📋 [EZql Simple] Obteniendo todas las tareas...');
    try {
      const { sql, parameters } = dbClient
        .select('*')
        .from('Tasks')
        .build();
      
      const tasks = await dbClient.execute(sql, parameters);
      
      res.json({
        success: true,
        data: tasks,
        message: `Se encontraron ${tasks.length} tareas`,
        framework: 'EZql Simplified',
        approach: 'Express simplificado con EZqlApplication'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        framework: 'EZql Simplified'
      });
    }
  });

  // GET /simple/tasks/:id - Obtener tarea por ID
  router.get('/simple/tasks/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`🔍 [EZql Simple] Buscando tarea con ID: ${id}`);
    
    try {
      const { sql, parameters } = dbClient
        .select('*')
        .from('Tasks')
        .where('id', '=', parseInt(id))
        .build();
      
      const tasks = await dbClient.execute(sql, parameters);
      const task = tasks[0];
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada',
          framework: 'EZql Simplified'
        });
      }
      
      res.json({
        success: true,
        data: task,
        framework: 'EZql Simplified'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        framework: 'EZql Simplified'
      });
    }
  });

  // POST /simple/tasks - Crear nueva tarea
  router.post('/simple/tasks', async (req, res) => {
    const taskData = req.body;
    console.log('➕ [EZql Simple] Creando nueva tarea:', taskData);
    
    try {
      const result = await dbClient
        .insert()
        .into('Tasks')
        .values({
          title: taskData.title || 'Nueva Tarea Simplificada',
          description: taskData.description || 'Creada con EZql Application',
          completed: taskData.completed || false
        })
        .execute();
      
      res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente con sintaxis simplificada',
        data: result,
        framework: 'EZql Simplified'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        framework: 'EZql Simplified'
      });
    }
  });

  // PUT /simple/tasks/:id - Actualizar tarea
  router.put('/simple/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`✏️ [EZql Simple] Actualizando tarea ${id}:`, updateData);
    
    try {
      const result = await dbClient
        .update()
        .table('Tasks')
        .set(updateData)
        .where('id', '=', parseInt(id))
        .execute();
      
      res.json({
        success: true,
        message: `Tarea ${id} actualizada exitosamente`,
        data: result,
        framework: 'EZql Simplified'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        framework: 'EZql Simplified'
      });
    }
  });

  // DELETE /simple/tasks/:id - Eliminar tarea
  router.delete('/simple/tasks/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ [EZql Simple] Eliminando tarea ${id}`);
    
    try {
      const { sql, parameters } = dbClient
        .delete()
        .from('Tasks')
        .where('id', '=', parseInt(id))
        .build();
      
      const result = await dbClient.execute(sql, parameters);
      
      res.json({
        success: true,
        message: `Tarea ${id} eliminada exitosamente`,
        data: result,
        framework: 'EZql Simplified'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        framework: 'EZql Simplified'
      });
    }
  });

  // ===== RUTAS ADICIONALES =====

  // GET /simple/stats - Estadísticas de la aplicación
  router.get('/simple/stats', (req, res) => {
    const stats = app.getStats();
    res.json({
      message: 'Estadísticas de EZqlApplication',
      stats,
      framework: 'EZql Simplified',
      benefits: [
        'Express configurado automáticamente',
        'Middlewares incluidos (CORS, JSON, etc.)',
        'Error handling automático',
        'Documentación automática',
        'DI Container incluido'
      ]
    });
  });

  // GET /simple/compare - Comparar los 3 enfoques
  router.get('/simple/compare', (req, res) => {
    res.json({
      message: 'Comparación de los 3 enfoques de EZql Framework',
      approaches: {
        decorators: {
          description: 'Framework con decoradores tipo NestJS',
          port: 3002,
          file: 'test.ts',
          syntax: '@Controller(), @Get(), @Post()',
          benefits: [
            'Código más declarativo',
            'Inyección automática de dependencias',
            'Metadata reflection',
            'Registro automático de rutas'
          ],
          example: `
@Controller('tasks')
export class TasksController {
  @Get()
  async findAll(@Db() dbClient: EZqlClient) { ... }
}`
        },
        simplified: {
          description: 'EZqlApplication - Express simplificado',
          port: 3004,
          file: 'test-simplified.ts',
          syntax: 'router.get(), router.post() con EZqlApplication',
          benefits: [
            'Express preconfigurado',
            'Middlewares automáticos',
            'Sintaxis familiar',
            'Flexibilidad de Express'
          ],
          example: `
const app = new EZqlApplication(config);
const router = app.getRouter();
router.get('/tasks', async (req, res) => { ... });`
        },
        traditional: {
          description: 'Express tradicional puro',
          port: 3003,
          file: 'test-express.ts',
          syntax: 'app.get(), app.post() tradicional',
          benefits: [
            'Control total',
            'Sintaxis Express estándar',
            'Máxima flexibilidad',
            'Debugging directo'
          ],
          example: `
const app = express();
app.get('/api/tasks', async (req, res) => { ... });`
        }
      },
      framework: 'EZql Simplified'
    });
  });

  // ===== USAR EXPRESS DIRECTO PARA CASOS ESPECIALES =====
  
  // También puedes usar la app Express directamente si necesitas algo específico
  expressApp.get('/direct/special', (req, res) => {
    res.json({
      message: 'Endpoint usando Express directamente',
      note: 'Puedes acceder a la app Express subyacente cuando necesites control total',
      framework: 'EZql Simplified (Direct Express)'
    });
  });

  // ===== INICIAR SERVIDOR =====
  
  console.log('🚀 Iniciando servidor...');
  await app.listen();
  
  console.log('');
  console.log('🎉 ¡EZql Application funcionando!');
  console.log('🌐 Servidor: http://localhost:3004');
  console.log('📚 Documentación: http://localhost:3004/docs');
  console.log('📊 Estadísticas: http://localhost:3004/simple/stats');
  console.log('🔄 Comparación: http://localhost:3004/simple/compare');
  console.log('');
  console.log('📋 Endpoints principales:');
  console.log('   GET    /simple/tasks              - Listar todas las tareas');
  console.log('   GET    /simple/tasks/:id          - Obtener tarea por ID');
  console.log('   POST   /simple/tasks              - Crear nueva tarea');
  console.log('   PUT    /simple/tasks/:id          - Actualizar tarea');
  console.log('   DELETE /simple/tasks/:id          - Eliminar tarea');
  console.log('   GET    /simple/stats              - Estadísticas de la app');
  console.log('   GET    /simple/compare            - Comparar enfoques');
  console.log('   GET    /direct/special            - Endpoint usando Express directo');
  console.log('');
  console.log('💡 Ejemplos de prueba:');
  console.log('   curl http://localhost:3004/simple/tasks');
  console.log('   curl http://localhost:3004/simple/stats');
  console.log('   curl http://localhost:3004/simple/compare');
  console.log('   curl -X POST http://localhost:3004/simple/tasks -H "Content-Type: application/json" -d \'{"title":"Tarea Simplificada","description":"Con EZqlApplication"}\'');
  console.log('');
  console.log('🎯 ENFOQUES DISPONIBLES:');
  console.log('   📦 Decoradores:     http://localhost:3002 (test.ts)');
  console.log('   ⚡ Express Puro:    http://localhost:3003 (test-express.ts)');
  console.log('   🎨 Simplificado:    http://localhost:3004 (test-simplified.ts)');
}

main().catch(err => {
  console.error('❌ Error al iniciar la aplicación simplificada:', err);
  process.exit(1);
});
