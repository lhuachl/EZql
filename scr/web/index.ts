// === PUNTO DE ENTRADA DEL FRAMEWORK WEB ===
// Exporta todas las funcionalidades del framework web EZql

// === DECORADORES ===
export * from './decorators';

// === INYECCIÓN DE DEPENDENCIAS ===
export * from './di-container';

// === ROUTING ===
export * from './router';

// === APLICACIÓN PRINCIPAL ===
export * from './application';

// === TIPOS ===
export * from './types';

// === CONTROLADORES DE EJEMPLO ===
export { 
  UserController, 
  HealthController, 
  UserService 
} from './controllers/user.controller';

// === UTILIDADES ===
export {
  // Función principal para bootstrap rápido
  bootstrap,
  // Factory para crear aplicaciones
  createEZqlApp,
  // Middlewares comunes
  authMiddleware,
  loggingMiddleware,
  rateLimitMiddleware
} from './application';

// === EJEMPLO DE USO RÁPIDO ===

/**
 * Ejemplo de uso del framework:
 * 
 * ```typescript
 * import { bootstrap, Controller, Get, Post, Body, Param } from 'ezql/web';
 * import { EZqlClient } from 'ezql';
 * 
 * @Controller('/api/products')
 * class ProductController {
 *   @Get('/')
 *   async findAll(@Db() db: EZqlClient) {
 *     return await db.select().from('products').execute();
 *   }
 * 
 *   @Post('/')
 *   async create(@Body() data: any, @Db() db: EZqlClient) {
 *     return await db.insert().into('products').values(data).execute();
 *   }
 * }
 * 
 * // Iniciar aplicación
 * const ezqlClient = EZqlClient.create({
 *   server: 'localhost',
 *   database: 'mydb',
 *   user: 'user',
 *   password: 'pass'
 * });
 * 
 * bootstrap({
 *   controllers: [ProductController],
 *   ezqlClient,
 *   config: { port: 3000 }
 * });
 * ```
 */
