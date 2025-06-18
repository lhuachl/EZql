/**
 * EZql Framework - Test con Express Tradicional
 * Demostración usando sintaxis clásica de Express sin decoradores
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { SimpleEZqlClient as EZqlClient, ConnectionConfig } from './simple-client';

// ===== CONFIGURACIÓN EXPRESS =====

const app = express();
const PORT = 3003; // Puerto diferente para no conflicto con decoradores

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== CONFIGURACIÓN BASE DE DATOS =====

const config: ConnectionConfig = {
  server: 'localhost',
  database: 'pylonbaytest',
  username: 'ezql_user',
  password: 'EzqlPass123!',
  port: 1433,
  encrypt: false,
  trustServerCertificate: true
};

let dbClient: EZqlClient;

// ===== RUTAS TASKS (CRUD COMPLETO) =====

// GET /api/tasks - Listar todas las tareas
app.get('/api/tasks', async (req: Request, res: Response) => {
  console.log('📋 [Express] Obteniendo todas las tareas...');
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
      framework: 'Express + EZql'
    });
  } catch (error: any) {
    console.error('❌ Error al obtener tareas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      framework: 'Express + EZql'
    });
  }
});

// GET /api/tasks/:id - Obtener tarea por ID
app.get('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`🔍 [Express] Buscando tarea con ID: ${id}`);
  
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
        framework: 'Express + EZql'
      });
    }
    
    res.json({
      success: true,
      data: task,
      framework: 'Express + EZql'
    });
  } catch (error: any) {
    console.error('❌ Error al obtener tarea:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      framework: 'Express + EZql'
    });
  }
});

// POST /api/tasks - Crear nueva tarea
app.post('/api/tasks', async (req: Request, res: Response) => {
  const taskData = req.body;
  console.log('➕ [Express] Creando nueva tarea:', taskData);
  
  try {
    const result = await dbClient
      .insert()
      .into('Tasks')
      .values({
        title: taskData.title || 'Nueva Tarea Express',
        description: taskData.description || 'Creada desde Express',
        completed: taskData.completed || false
      })
      .execute();
    
    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente desde Express',
      data: result,
      framework: 'Express + EZql'
    });
  } catch (error: any) {
    console.error('❌ Error al crear tarea:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      framework: 'Express + EZql'
    });
  }
});

// PUT /api/tasks/:id - Actualizar tarea
app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  console.log(`✏️ [Express] Actualizando tarea ${id}:`, updateData);
  
  try {
    const result = await dbClient
      .update()
      .table('Tasks')
      .set(updateData)
      .where('id', '=', parseInt(id))
      .execute();
    
    res.json({
      success: true,
      message: `Tarea ${id} actualizada exitosamente desde Express`,
      data: result,
      framework: 'Express + EZql'
    });
  } catch (error: any) {
    console.error('❌ Error al actualizar tarea:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      framework: 'Express + EZql'
    });
  }
});

// DELETE /api/tasks/:id - Eliminar tarea
app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`🗑️ [Express] Eliminando tarea ${id}`);
  
  try {
    const { sql, parameters } = dbClient
      .delete()
      .from('Tasks')
      .where('id', '=', parseInt(id))
      .build();
    
    const result = await dbClient.execute(sql, parameters);
    
    res.json({
      success: true,
      message: `Tarea ${id} eliminada exitosamente desde Express`,
      data: result,
      framework: 'Express + EZql'
    });
  } catch (error: any) {
    console.error('❌ Error al eliminar tarea:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      framework: 'Express + EZql'
    });
  }
});

// GET /api/tasks/completed/:status - Filtrar por estado
app.get('/api/tasks/completed/:status', async (req: Request, res: Response) => {
  const { status } = req.params;
  console.log(`🔍 [Express] Buscando tareas por estado: ${status}`);
  
  try {
    const isCompleted = status.toLowerCase() === 'true';
    const { sql, parameters } = dbClient
      .select('*')
      .from('Tasks')
      .where('completed', '=', isCompleted)
      .build();
    
    const tasks = await dbClient.execute(sql, parameters);
    
    res.json({
      success: true,
      data: tasks,
      message: `Se encontraron ${tasks.length} tareas ${isCompleted ? 'completadas' : 'pendientes'}`,
      framework: 'Express + EZql'
    });
  } catch (error: any) {
    console.error('❌ Error al obtener tareas por estado:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      framework: 'Express + EZql'
    });
  }
});

// ===== RUTAS USUARIOS (EJEMPLO ADICIONAL) =====

// GET /api/users - Ejemplo de consulta JOIN
app.get('/api/users', async (req: Request, res: Response) => {
  console.log('👥 [Express] Obteniendo usuarios...');
  
  try {
    // Usando EZql para crear usuarios ficticios desde Tasks
    const { sql, parameters } = dbClient
      .select(['id', 'title AS name', 'description AS email', 'created_at'])
      .from('Tasks')
      .where('completed', '=', false)
      .build();
    
    const users = await dbClient.execute(sql, parameters);
    
    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: `${user.name.toLowerCase().replace(/\s+/g, '')}@express.com`,
        created_at: user.created_at
      })),
      message: `${users.length} usuarios generados desde tareas pendientes`,
      framework: 'Express + EZql'
    });
  } catch (error: any) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      framework: 'Express + EZql'
    });
  }
});

// ===== RUTAS DE COMPARACIÓN =====

// GET /api/compare - Comparar con el framework de decoradores
app.get('/api/compare', (req: Request, res: Response) => {
  res.json({
    message: 'Comparación de enfoques',
    express_approach: {
      description: 'Express tradicional con EZql',
      port: PORT,
      benefits: [
        'Sintaxis familiar para desarrolladores Express',
        'Control total sobre middlewares',
        'Flexibilidad en el manejo de rutas',
        'Fácil debugging'
      ],
      example_endpoints: [
        'GET /api/tasks',
        'POST /api/tasks',
        'PUT /api/tasks/:id',
        'DELETE /api/tasks/:id'
      ]
    },
    decorators_approach: {
      description: 'Framework con decoradores tipo NestJS',
      port: 3002,
      benefits: [
        'Código más declarativo y limpio',
        'Inyección de dependencias automática',
        'Metadata reflection',
        'Registro automático de rutas'
      ],
      example_endpoints: [
        'GET /tasks',
        'POST /tasks',
        'PUT /tasks/:id',
        'DELETE /tasks/:id'
      ]
    },
    framework: 'Express + EZql'
  });
});

// ===== RUTAS DE INFORMACIÓN =====

// GET /api/health - Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    framework: 'Express + EZql',
    timestamp: new Date().toISOString(),
    database: 'connected',
    port: PORT
  });
});

// GET /api/docs - Documentación simple
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    title: 'EZql Framework - Express Traditional API',
    version: '1.0.0',
    description: 'API usando Express tradicional con EZql Query Builder',
    base_url: `http://localhost:${PORT}/api`,
    endpoints: {
      tasks: {
        'GET /tasks': 'Listar todas las tareas',
        'GET /tasks/:id': 'Obtener tarea por ID',
        'POST /tasks': 'Crear nueva tarea',
        'PUT /tasks/:id': 'Actualizar tarea',
        'DELETE /tasks/:id': 'Eliminar tarea',
        'GET /tasks/completed/:status': 'Filtrar tareas por estado'
      },
      users: {
        'GET /users': 'Obtener usuarios (generados desde tareas)'
      },
      utility: {
        'GET /health': 'Health check',
        'GET /docs': 'Esta documentación',
        'GET /compare': 'Comparar enfoques Express vs Decoradores'
      }
    },
    framework: 'Express + EZql'
  });
});

// ===== MANEJO DE ERRORES =====

// 404 Handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`,
    suggestion: 'Visita /api/docs para ver los endpoints disponibles',
    framework: 'Express + EZql'
  });
});

// Error Handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('❌ [Express] Error global:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    framework: 'Express + EZql'
  });
});

// ===== INICIO DEL SERVIDOR =====

async function startExpressServer() {
  try {
    console.log('🚀 Iniciando EZql con Express tradicional...');
    
    // Conectar a la base de datos
    dbClient = EZqlClient.create(config);
    await dbClient.connect();
    console.log('✅ Conectado a SQL Server');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ¡Servidor Express funcionando!');
      console.log(`🌐 Servidor: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔄 Comparación: http://localhost:${PORT}/api/compare`);
      console.log('');
      console.log('📋 Endpoints principales:');
      console.log(`   GET    /api/tasks                    - Listar todas las tareas`);
      console.log(`   GET    /api/tasks/:id                - Obtener tarea por ID`);
      console.log(`   POST   /api/tasks                    - Crear nueva tarea`);
      console.log(`   PUT    /api/tasks/:id                - Actualizar tarea`);
      console.log(`   DELETE /api/tasks/:id                - Eliminar tarea`);
      console.log(`   GET    /api/tasks/completed/:status  - Tareas por estado`);
      console.log(`   GET    /api/users                    - Usuarios (desde tareas)`);
      console.log('');
      console.log('💡 Ejemplos de prueba:');
      console.log(`   curl http://localhost:${PORT}/api/tasks`);
      console.log(`   curl http://localhost:${PORT}/api/tasks/1`);
      console.log(`   curl http://localhost:${PORT}/api/tasks/completed/false`);
      console.log(`   curl -X POST http://localhost:${PORT}/api/tasks -H "Content-Type: application/json" -d '{"title":"Tarea Express","description":"Creada con Express tradicional"}'`);
      console.log(`   curl http://localhost:${PORT}/api/compare`);
      console.log('');
      console.log('🔄 Comparar con decoradores en puerto 3002');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar servidor Express:', error);
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor Express...');
  if (dbClient) {
    await dbClient.disconnect();
    console.log('✅ Desconectado de SQL Server');
  }
  process.exit(0);
});

// Iniciar servidor
startExpressServer();
