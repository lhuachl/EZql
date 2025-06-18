/**
 * EZql Framework - Test Completo con Decoradores
 * Demostración completa del framework usando decoradores tipo NestJS
 */

import 'reflect-metadata';
import { SimpleEZqlClient as EZqlClient, ConnectionConfig } from './simple-client';
import { EZqlApplication } from './scr/web/application';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Db } from './scr/web/decorators';

// ===== CONTROLADORES DE EJEMPLO =====

/**
 * TasksController - Controlador principal para la tabla Tasks
 * Maneja todas las operaciones CRUD para las tareas
 */
@Controller('tasks')
export class TasksController {
  
  @Get()
  async findAll(@Db() dbClient: EZqlClient) {
    console.log('📋 Obteniendo todas las tareas...');
    try {
      const { sql, parameters } = dbClient
        .select('*')
        .from('Tasks')
        .build();
      
      const tasks = await dbClient.execute(sql, parameters);
      return {
        success: true,
        data: tasks,
        message: `Se encontraron ${tasks.length} tareas`
      };    } catch (error: any) {
      console.error('❌ Error al obtener tareas:', error);
      return { success: false, error: error.message };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Db() dbClient: EZqlClient) {
    console.log(`🔍 Buscando tarea con ID: ${id}`);
    try {
      const { sql, parameters } = dbClient
        .select('*')
        .from('Tasks')
        .where('id', '=', parseInt(id))
        .build();
      
      const tasks = await dbClient.execute(sql, parameters);
      const task = tasks[0];
      
      if (!task) {
        return { success: false, message: 'Tarea no encontrada' };
      }
      
      return { success: true, data: task };    } catch (error: any) {
      console.error('❌ Error al obtener tarea:', error);
      return { success: false, error: error.message };
    }
  }

  @Post()
  async create(@Body() taskData: any, @Db() dbClient: EZqlClient) {
    console.log('➕ Creando nueva tarea:', taskData);
    try {
      const result = await dbClient
        .insert()
        .into('Tasks')
        .values({
          title: taskData.title || 'Nueva Tarea',
          description: taskData.description || 'Sin descripción',
          completed: taskData.completed || false
        })
        .execute();
      
      return { 
        success: true, 
        message: 'Tarea creada exitosamente', 
        data: result 
      };    } catch (error: any) {
      console.error('❌ Error al crear tarea:', error);
      return { success: false, error: error.message };
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: any, @Db() dbClient: EZqlClient) {
    console.log(`✏️ Actualizando tarea ${id}:`, updateData);
    try {
      const result = await dbClient
        .update()
        .table('Tasks')
        .set(updateData)
        .where('id', '=', parseInt(id))
        .execute();
      
      return { 
        success: true, 
        message: `Tarea ${id} actualizada exitosamente`,
        data: result 
      };    } catch (error: any) {
      console.error('❌ Error al actualizar tarea:', error);
      return { success: false, error: error.message };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Db() dbClient: EZqlClient) {
    console.log(`🗑️ Eliminando tarea ${id}`);
    try {
      const { sql, parameters } = dbClient
        .delete()
        .from('Tasks')
        .where('id', '=', parseInt(id))
        .build();
      
      const result = await dbClient.execute(sql, parameters);
      
      return { 
        success: true, 
        message: `Tarea ${id} eliminada exitosamente`,
        data: result 
      };    } catch (error: any) {
      console.error('❌ Error al eliminar tarea:', error);
      return { success: false, error: error.message };
    }
  }

  @Get('completed/:status')
  async findByStatus(@Param('status') status: string, @Db() dbClient: EZqlClient) {
    console.log(`🔍 Buscando tareas por estado: ${status}`);
    try {
      const isCompleted = status.toLowerCase() === 'true';
      const { sql, parameters } = dbClient
        .select('*')
        .from('Tasks')
        .where('completed', '=', isCompleted)
        .build();
      
      const tasks = await dbClient.execute(sql, parameters);
      return {
        success: true,
        data: tasks,
        message: `Se encontraron ${tasks.length} tareas ${isCompleted ? 'completadas' : 'pendientes'}`
      };    } catch (error: any) {
      console.error('❌ Error al obtener tareas por estado:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * CatsController - Ejemplo básico sin base de datos (como NestJS)
 */
@Controller('cats')
export class CatsController {
  
  @Get()
  findAll(): any {
    return {
      message: 'Lista de todos los gatos',
      data: [
        { id: 1, name: 'Fluffy', breed: 'Persa' },
        { id: 2, name: 'Whiskers', breed: 'Siamés' },
        { id: 3, name: 'Shadow', breed: 'Negro' }
      ]
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string): any {
    return {
      message: `Información del gato #${id}`,
      data: { id: parseInt(id), name: `Gato ${id}`, breed: 'Doméstico' }
    };
  }

  @Post()
  create(@Body() createCatDto: any): any {
    return {
      message: 'Nuevo gato creado',
      data: { id: Date.now(), ...createCatDto }
    };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: any): any {
    return {
      message: `Gato #${id} actualizado`,
      data: { id: parseInt(id), ...updateCatDto }
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string): any {
    return {
      message: `Gato #${id} eliminado exitosamente`
    };
  }
}

/**
 * ProductsController - Ejemplo con query parameters
 */
@Controller('products')
export class ProductsController {

  @Get()
  findAll(@Query() query: any): any {
    return {
      message: 'Lista de productos',
      filters: query,
      data: [
        { id: 1, name: 'Laptop', category: query.category || 'electronics', price: 999 },
        { id: 2, name: 'Mouse', category: query.category || 'electronics', price: 25 }
      ],
      example: 'Prueba con: /products?category=electronics&limit=10'
    };
  }

  @Get('search')
  search(@Query('q') searchTerm: string, @Query('category') category?: string): any {
    return {
      message: 'Resultados de búsqueda',
      searchTerm,
      category,
      results: [
        { id: 1, name: `Producto que contiene "${searchTerm}"`, category: category || 'general' }
      ]
    };
  }
}

// ===== FUNCIÓN PRINCIPAL =====

async function main() {
  console.log('🚀 Iniciando EZql Framework con Decoradores...');
  console.log('📁 Todos los controladores están definidos en test.ts');

  // Configuración de base de datos
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

  // Crear aplicación EZql
  const app = new EZqlApplication({
    port: 3000,
    host: 'localhost',
    cors: { origin: '*', credentials: false },
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'EZql Framework - Demo Completo con Tasks',
      version: '1.0.0'
    }
  });

  // Configurar cliente de base de datos
  app.useEZql(dbClient);
  console.log('✅ Aplicación EZql configurada');  // ===== REGISTRO DE CONTROLADORES CON DECORADORES =====
  console.log('📋 Registrando controladores...');
  
  app.useController(TasksController);    // Controlador principal para Tasks
  app.useController(CatsController);     // Ejemplo básico como NestJS
  app.useController(ProductsController); // Con query parameters
  console.log('✅ Controladores registrados');

  // Iniciar servidor
  console.log('🚀 Iniciando servidor...');
  await app.listen();
  
  console.log('');
  console.log('🎉 ¡EZql Framework funcionando!');
  console.log('🌐 Servidor: http://localhost:3002');
  console.log('');
  console.log('📚 Endpoints disponibles:');
  console.log('');
  console.log('📋 TasksController (Tabla Tasks):');
  console.log('   GET    /tasks                    - Listar todas las tareas');
  console.log('   GET    /tasks/:id                - Obtener tarea por ID');
  console.log('   POST   /tasks                    - Crear nueva tarea');
  console.log('   PUT    /tasks/:id                - Actualizar tarea');
  console.log('   DELETE /tasks/:id                - Eliminar tarea');
  console.log('   GET    /tasks/completed/:status  - Tareas por estado (true/false)');
  console.log('');
  console.log('🐱 CatsController (Ejemplo básico):');
  console.log('   GET    /cats                     - Listar todos los gatos');
  console.log('   GET    /cats/:id                 - Obtener gato por ID');
  console.log('   POST   /cats                     - Crear nuevo gato');
  console.log('   PUT    /cats/:id                 - Actualizar gato');
  console.log('   DELETE /cats/:id                 - Eliminar gato');
  console.log('');
  console.log('🛍️  ProductsController (Query parameters):');
  console.log('   GET    /products                 - Listar productos');
  console.log('   GET    /products/search          - Buscar productos');
  console.log('');
  console.log('💡 Ejemplos de prueba:');
  console.log('   curl http://localhost:3002/tasks');
  console.log('   curl http://localhost:3002/tasks/1');
  console.log('   curl http://localhost:3002/tasks/completed/false');
  console.log('   curl -X POST http://localhost:3002/tasks -H "Content-Type: application/json" -d \'{"title":"Nueva Tarea","description":"Descripción de la tarea","completed":false}\'');
  console.log('   curl -X PUT http://localhost:3002/tasks/1 -H "Content-Type: application/json" -d \'{"completed":true}\'');
  console.log('   curl -X DELETE http://localhost:3002/tasks/1');
  console.log('   curl http://localhost:3002/cats');
  console.log('   curl http://localhost:3002/products?category=electronics');
}

main().catch(err => {
  console.error('❌ Error al iniciar la API:', err);
  process.exit(1);
});
