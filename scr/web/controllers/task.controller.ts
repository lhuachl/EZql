/**
 * CONTROLADOR DE EJEMPLO PARA DEMOSTRAR EL FRAMEWORK EZQL
 * 
 * Este archivo muestra cómo usar los decoradores HTTP del framework EZql.
 * Es solo un ejemplo - el framework es genérico y puede usarse para cualquier tipo de API.
 * 
 * CARACTERISTICAS DEL FRAMEWORK:
 * - Decoradores estilo NestJS (@Get, @Post, @Put, @Delete)
 * - Inyección de dependencias (@Db, @Body, @Param, @Query)
 * - Query Builder integrado
 * - Compatible con Express tradicional
 */

import 'reflect-metadata';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Db } from '../decorators';
import { EZqlClient } from '../../core/EZqlClient';

// Ejemplo de controlador genérico - puedes crear cualquier tipo de controlador
@Controller('/api/example', {
  description: 'Controlador de ejemplo para demostrar el framework EZql',
  tags: ['Example']
})
export class ExampleController {

  @Get('/', {
    description: 'Endpoint de ejemplo usando decoradores',
    summary: 'Obtener datos de ejemplo'
  })
  async getExample(@Db() dbClient: EZqlClient) {
    // Ejemplo usando el query builder del framework
    const { sql, parameters } = dbClient
      .select('*')
      .from('Tasks')  // Usando la tabla de ejemplo
      .limit(5)
      .build();
    
    const data = await dbClient.execute(sql, parameters);
    
    return {
      message: '✅ Framework EZql funcionando con decoradores!',
      framework: 'EZql',
      features: ['Query Builder', 'Decoradores HTTP', 'TypeScript', 'SQL Server'],
      data: data.slice(0, 3) // Solo mostrar 3 registros de ejemplo
    };
  }

  @Post('/test', {
    description: 'Endpoint POST de ejemplo',
    summary: 'Probar funcionalidad POST'
  })
  async postExample(@Body() body: any, @Db() dbClient: EZqlClient) {
    return {
      message: '✅ POST con decoradores funciona!',
      received: body,
      timestamp: new Date(),
      dbConnected: dbClient.isConnected()
    };
  }

  @Get('/param/:id', {
    description: 'Ejemplo con parámetros de ruta',
    summary: 'Obtener por ID'
  })
  async getByParam(@Param('id') id: string) {
    return {
      message: '✅ Parámetros de ruta funcionan!',
      receivedId: id,
      parsedId: parseInt(id) || 'No es un número'
    };
  }

  @Get('/query', {
    description: 'Ejemplo con query parameters',
    summary: 'Filtrar con query'
  })
  async getByQuery(@Query() query: any) {
    return {
      message: '✅ Query parameters funcionan!',
      receivedQuery: query,
      example: 'Prueba con: /api/example/query?name=test&page=1'
    };
  }
}
