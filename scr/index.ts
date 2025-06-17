// EZql - Enterprise SQL Query Builder & Web Framework
// Punto de entrada principal con arquitectura refactorizada

// === CORE ORM ===

// Cliente principal
export { EZqlClient } from './core/EZqlClient';

// Tipos y interfaces
export * from './types/core';
export * from './types/fluent-interfaces';

// Abstracciones para extensibilidad
export * from './core/abstractions';

// Implementaciones específicas para SQL Server
export { SqlServerConnectionProvider } from './core/connection/SqlServerConnectionProvider';
export { SqlServerQueryExecutor } from './core/execution/SqlServerQueryExecutor';

// Query builders
export { SelectQueryBuilder } from './core/query/SelectQueryBuilder';
export { InsertQueryBuilder } from './core/query/InsertQueryBuilder';
export { UpdateQueryBuilder } from './core/query/UpdateQueryBuilder';
export { DeleteQueryBuilder } from './core/query/DeleteQueryBuilder';

// === ENTIDADES EZQL (ACTIVE RECORD PATTERN) ===
export { EZqlEntity } from './core/entity/EZqlEntity';
export type { EntityConfig, FindOptions } from './core/entity/EZqlEntity';

// Fluent query builders
export { FluentSelectQuery } from './builders/FluentSelectQuery';
export { FluentInsertQuery } from './builders/FluentInsertQuery';
export { FluentUpdateQuery } from './builders/FluentUpdateQuery';
export { FluentDeleteQuery } from './builders/FluentDeleteQuery';

// === WEB FRAMEWORK ===

// Framework web completo con decoradores (re-exportación específica para evitar conflictos)
export {
  // Decoradores
  Controller, Get, Post, Put, Delete, Patch, Options, Head,
  Body, Param, Query, Header, Req, Res, Next, Db, Context,
  UseMiddleware, ValidateBody, ValidateQuery, ValidateParams,
  Serialize, ApiOperation,
  // DI Container
  Injectable, Inject, Service, Transient, RequestScoped, Provider, Module,
  DIContainer, getContainer, register, resolve,
  // Application & Router
  EZqlApplication, EZqlRouter, createEZqlApp, bootstrap,
  createEZqlRouter, ezqlMiddleware, ezqlErrorHandler,
  // Middlewares
  authMiddleware, loggingMiddleware, rateLimitMiddleware,
  // Controllers de ejemplo
  UserController, HealthController
} from './web';

// Tipos del framework web (con alias para evitar conflictos)
export type {
  HttpMethod, RouteHandler, MiddlewareFunction,
  EZqlContext, CreateUserDto as WebCreateUserDto, UpdateUserDto as WebUpdateUserDto,
  ApiResponse, PaginatedResponse, EZqlWebConfig,
  Constructor, ServiceIdentifier, ServiceScope
} from './web/types';

// Alias para importación específica del framework web
export * as Web from './web';

// === FACTORY FUNCTIONS ===

// Factory function para simplificar el uso del ORM
export function createEZqlClient(config: import('./types/core').ConnectionConfig, queryConfig?: import('./types/core').QueryConfig) {
  return import('./core/EZqlClient').then(module => module.EZqlClient.create(config, queryConfig));
}

// Función de conveniencia para uso inmediato del ORM
export async function ezql(config: import('./types/core').ConnectionConfig) {
  const { EZqlClient } = await import('./core/EZqlClient');
  const client = EZqlClient.create(config, { logQueries: true });
  await client.connect();
  return client;
}

// Factory function para crear aplicación web completa
export async function createWebApp(options: {
  database: import('./types/core').ConnectionConfig;
  controllers: Array<new (...args: any[]) => any>;
  config?: import('./web/types').EZqlWebConfig;
}) {
  const { bootstrap } = await import('./web');
  const { EZqlClient } = await import('./core/EZqlClient');
  
  const ezqlClient = EZqlClient.create(options.database, { logQueries: true });
  
  return bootstrap({
    controllers: options.controllers,
    ezqlClient,
    config: options.config
  });
}
