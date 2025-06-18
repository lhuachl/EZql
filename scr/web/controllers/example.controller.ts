/**
 * EJEMPLO DE CONTROLADOR USANDO DECORADORES EZQL
 * 
 * Funciona exactamente igual que NestJS:
 * - @Controller() define la ruta base
 * - @Get(), @Post(), etc. definen los métodos HTTP
 * - Parámetros se inyectan con decoradores
 */

import 'reflect-metadata';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Db } from '../decorators';
import { EZqlClient } from '../../core/EZqlClient';

// Ejemplo básico - igual que NestJS
@Controller('cats')
export class CatsController {
  
  @Get()
  findAll(): string {
    // Este método se mapeará a GET /cats
    return 'Esta acción retorna todos los gatos';
  }

  @Get(':id')
  findOne(@Param('id') id: string): string {
    // Este método se mapeará a GET /cats/:id
    return `Esta acción retorna el gato #${id}`;
  }

  @Post()
  create(@Body() createCatDto: any): string {
    // Este método se mapeará a POST /cats
    return 'Esta acción agrega un nuevo gato';
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: any): string {
    // Este método se mapeará a PUT /cats/:id
    return `Esta acción actualiza el gato #${id}`;
  }

  @Delete(':id')
  remove(@Param('id') id: string): string {
    // Este método se mapeará a DELETE /cats/:id
    return `Esta acción elimina el gato #${id}`;
  }
}

// Ejemplo con base de datos usando EZql
@Controller('users')
export class UsersController {

  @Get()
  async findAll(@Db() dbClient: EZqlClient) {
    // Usando el query builder de EZql
    const { sql, parameters } = dbClient
      .select('*')
      .from('Tasks')  // Tabla de ejemplo
      .build();
    
    const users = await dbClient.execute(sql, parameters);
    return users;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Db() dbClient: EZqlClient) {
    const { sql, parameters } = dbClient
      .select('*')
      .from('Tasks')
      .where('id', '=', parseInt(id))
      .build();
    
    const user = await dbClient.execute(sql, parameters);
    return user[0] || null;
  }

  @Post()
  async create(@Body() userData: any, @Db() dbClient: EZqlClient) {
    const result = await dbClient
      .insert()
      .into('Tasks')
      .values({
        title: userData.name || 'Usuario sin nombre',
        description: userData.email || 'Sin email',
        completed: false
      })
      .execute();
    
    return { message: 'Usuario creado', data: result };
  }
}

// Ejemplo con query parameters
@Controller('products')
export class ProductsController {

  @Get()
  findAll(@Query() query: any): any {
    // Manejo de query parameters: GET /products?category=electronics&limit=10
    return {
      message: 'Lista de productos',
      filters: query,
      example: 'Prueba con: /products?category=electronics&limit=10'
    };
  }

  @Get('search')
  search(@Query('q') searchTerm: string): any {
    // Query parameter específico: GET /products/search?q=laptop
    return {
      message: 'Resultados de búsqueda',
      searchTerm,
      results: []
    };
  }
}
