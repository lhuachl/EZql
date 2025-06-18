import 'reflect-metadata';
import { SimpleEZqlClient as EZqlClient, ConnectionConfig } from './simple-client';
import { EZqlApplication } from './scr/web/application';
import { TaskController } from './scr/web/controllers/task.controller';

async function main() {
  console.log('🚀 EZql Framework - Demostración de Enfoque Híbrido');
  console.log('📋 Este framework permite usar decoradores (estilo NestJS) O Express tradicional');

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
  
  const dbClient = EZqlClient.create(config);
  await dbClient.connect();
  console.log('✅ Conectado a SQL Server');

  // === CREAR APLICACIÓN EZQL ===
  const app = new EZqlApplication({
    port: 3001,
    host: 'localhost',
    cors: { origin: '*', credentials: false },
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'EZql Framework - API Híbrida',
      description: 'Ejemplo de uso con decoradores y Express tradicional',
      version: '1.0.0'
    }
  });

  // Configurar cliente de base de datos
  app.useEZql(dbClient);
  console.log('✅ Aplicación EZql inicializada');

  // =====================================================
  // OPCIÓN 1: USAR DECORADORES (Estilo NestJS/Spring)
  // =====================================================
  console.log('\n🎯 ENFOQUE 1: Registrando controladores con DECORADORES');
  console.log('   → Elegante, moderno, menos código');
  console.log('   → Ideal para APIs REST estructuradas');
  
  try {
    app.useController(TaskController);
    console.log('   ✅ TaskController registrado con decoradores');
    console.log('      📍 Rutas disponibles: GET/POST/PUT/DELETE /tasks/*');
  } catch (error) {
    console.log('   ⚠️  Error con decoradores:', (error as Error).message);
  }

  // =====================================================
  // OPCIÓN 2: EXPRESS TRADICIONAL (Máxima flexibilidad)
  // =====================================================
  console.log('\n🔧 ENFOQUE 2: Registrando rutas con EXPRESS TRADICIONAL');
  console.log('   → Flexibilidad total, control granular');
  console.log('   → Ideal para lógica compleja, middlewares personalizados');

  const expressApp = app.getExpressApp();

  // === EJEMPLO 1: API de Usuarios ===
  expressApp.get('/api/users', async (req, res) => {
    try {
      // Simular tabla Users (podrías cambiar por cualquier tabla)
      const { sql, parameters } = dbClient
        .select('*')
        .from('Tasks') // Usando Tasks como ejemplo
        .limit(5)
        .build();
      
      const users = await dbClient.execute(sql, parameters);
      res.json({ success: true, data: users, note: 'API genérica - funciona con cualquier tabla' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // === EJEMPLO 2: Endpoint con middleware personalizado ===
  const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Token requerido para acceso' });
    }
    console.log('🔑 Middleware de autenticación ejecutado');
    next();
  };

  expressApp.get('/api/protected-data', authMiddleware, async (req, res) => {
    try {
      const { sql, parameters } = dbClient
        .select('COUNT(*) as total')
        .from('Tasks')
        .build();
      
      const result = await dbClient.execute(sql, parameters);
      res.json({ 
        message: 'Datos protegidos accedidos exitosamente', 
        data: result,
        note: 'Este endpoint requiere autenticación'
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // === EJEMPLO 3: Endpoint complejo con múltiples consultas ===
  expressApp.get('/api/dashboard/stats', async (req, res) => {
    try {
      // Múltiples consultas usando el query builder
      const totalQuery = dbClient.select('COUNT(*) as total').from('Tasks').build();
      const completedQuery = dbClient
        .select('COUNT(*) as completed')
        .from('Tasks')
        .where('completed', '=', true)
        .build();
      
      const [totalResult, completedResult] = await Promise.all([
        dbClient.execute(totalQuery.sql, totalQuery.parameters),
        dbClient.execute(completedQuery.sql, completedQuery.parameters)
      ]);

      res.json({
        success: true,
        stats: {
          total: totalResult[0].total,
          completed: completedResult[0].completed,
          pending: totalResult[0].total - completedResult[0].completed,
          note: 'Estadísticas calculadas con múltiples consultas'
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // === EJEMPLO 4: Funcionalidades específicas de Express ===
  expressApp.use('/api/middleware-example', (req, res, next) => {
    console.log(`🔄 Request: ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  expressApp.post('/api/upload', (req, res) => {
    // Aquí irían middlewares como multer para manejar archivos
    res.json({ 
      message: 'Endpoint para upload de archivos',
      note: 'Requiere middleware específico de Express como multer',
      framework: 'EZql permite usar cualquier middleware de Express'
    });
  });

  // === EJEMPLO 5: WebSockets, SSE, etc. ===
  expressApp.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    res.write('data: {"message": "Server-Sent Events habilitado", "framework": "EZql"}\n\n');
    
    const interval = setInterval(() => {
      res.write(`data: {"timestamp": "${new Date().toISOString()}", "message": "Ping"}\n\n`);
    }, 5000);
    
    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // === ENDPOINT DE SALUD Y MONITOREO ===
  expressApp.get('/health', async (req, res) => {
    try {
      const healthCheck = await dbClient.healthCheck();
      const stats = dbClient.getClientStats();
      
      res.json({
        status: 'healthy',
        database: healthCheck,
        client: stats,
        framework: {
          name: 'EZql',
          version: '1.0.0',
          features: ['Decoradores', 'Express tradicional', 'Query Builder', 'TypeScript']
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // === RUTAS DINÁMICAS ===
  expressApp.get('/api/dynamic/:table', async (req, res) => {
    try {
      const { table } = req.params;
      const { limit = 10 } = req.query;
      
      const { sql, parameters } = dbClient
        .select('*')
        .from(table)
        .limit(parseInt(limit as string))
        .build();
      
      const data = await dbClient.execute(sql, parameters);
      res.json({ 
        success: true, 
        table, 
        data,
        note: 'Endpoint genérico que funciona con cualquier tabla'
      });
    } catch (error) {
      res.status(500).json({ 
        error: (error as Error).message,
        note: 'Asegúrate de que la tabla existe'
      });
    }
  });

  console.log('   ✅ Rutas Express tradicionales registradas:');
  console.log('      📍 GET /api/users - API genérica de usuarios');
  console.log('      📍 GET /api/protected-data - Endpoint con auth');
  console.log('      📍 GET /api/dashboard/stats - Consultas complejas');
  console.log('      📍 POST /api/upload - Upload de archivos');
  console.log('      📍 GET /api/events - Server-Sent Events');
  console.log('      📍 GET /api/dynamic/:table - API genérica para cualquier tabla');
  console.log('      📍 GET /health - Health check');

  // =====================================================
  // INICIAR SERVIDOR
  // =====================================================
  console.log('\n🚀 Iniciando servidor...');
  await app.listen();
  
  console.log('\n🎉 ¡EZql Framework ejecutándose!');
  console.log('📍 URL: http://localhost:3001');
  console.log('📚 Documentación: http://localhost:3001/docs');
  console.log('\n📋 ENDPOINTS DISPONIBLES:');
  console.log('\n🎯 CON DECORADORES (Estilo NestJS):');
  console.log('   GET    /tasks              - Listar tareas');
  console.log('   GET    /tasks/:id          - Obtener tarea');
  console.log('   POST   /tasks              - Crear tarea');
  console.log('   PUT    /tasks/:id          - Actualizar tarea');
  console.log('   DELETE /tasks/:id          - Eliminar tarea');
  console.log('   GET    /tasks/search       - Buscar tareas');
  console.log('\n🔧 CON EXPRESS TRADICIONAL:');
  console.log('   GET    /api/users          - API genérica');
  console.log('   GET    /api/protected-data - Con autenticación');
  console.log('   GET    /api/dashboard/stats- Estadísticas');
  console.log('   POST   /api/upload         - Upload archivos');
  console.log('   GET    /api/events         - Server-Sent Events');
  console.log('   GET    /api/dynamic/:table - API para cualquier tabla');
  console.log('   GET    /health             - Health check');
  
  console.log('\n💡 CARACTERÍSTICAS DEL FRAMEWORK:');
  console.log('🎯 Decoradores: @Controller, @Get, @Post, @Put, @Delete');
  console.log('🔧 Express: Acceso completo al objeto Express para máxima flexibilidad');
  console.log('🔄 Query Builder: Sintaxis fluida para construcción de consultas SQL');
  console.log('📝 TypeScript: Tipado completo y autocompletado');
  console.log('📚 Documentación: Swagger/OpenAPI automático');
  console.log('\n🚀 El desarrollador puede elegir el enfoque que prefiera!');
}

main().catch(err => {
  console.error('❌ Error al iniciar el framework:', err);
  process.exit(1);
});
