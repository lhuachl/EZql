// EZql - Enterprise SQL Query Builder
// Punto de entrada principal con arquitectura refactorizada

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

// Fluent query builders
export { FluentSelectQuery } from './builders/FluentSelectQuery';
export { FluentInsertQuery } from './builders/FluentInsertQuery';
export { FluentUpdateQuery } from './builders/FluentUpdateQuery';
export { FluentDeleteQuery } from './builders/FluentDeleteQuery';

// Factory function para simplificar el uso
export function createEZqlClient(config: import('./types/core').ConnectionConfig, queryConfig?: import('./types/core').QueryConfig) {
  return import('./core/EZqlClient').then(module => module.EZqlClient.create(config, queryConfig));
}

// Función de conveniencia para uso inmediato
export async function ezql(config: import('./types/core').ConnectionConfig) {
  const { EZqlClient } = await import('./core/EZqlClient');
  const client = EZqlClient.create(config, { logQueries: true });
  await client.connect();
  return client;
}
