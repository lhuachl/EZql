import { SqlOperator, SqlValue, OrderDirection, JoinType } from './core';

// === PRINCIPIO DE RESPONSABILIDAD ÚNICA ===
// Interfaces base separadas por responsabilidad

/**
 * Interface base para todas las operaciones de query
 * Principio: Responsabilidad única - solo define la ejecución básica
 */
export interface IQueryExecutable<T = any> {
  execute(): Promise<T[]>;
  toSql(): { query: string; parameters: any[] };
}

/**
 * Interface para operaciones que pueden devolver datos específicos
 * Principio: Segregación de interfaces - separada de la ejecución básica
 */
export interface IReturnable<T = any> {
  returning(columns: string | string[]): IQueryExecutable<T>;
}

// === INTERFACES PARA CONDICIONES WHERE ===
// Principio: Segregación de interfaces - separar tipos de condiciones

/**
 * Interface para condiciones WHERE básicas
 */
export interface IWhereConditions<T> {
  where(column: string, operator: SqlOperator, value: SqlValue): T;
  where(column: string, value: SqlValue): T;
  where(condition: string): T;
}

/**
 * Interface para condiciones WHERE avanzadas
 */
export interface IAdvancedWhereConditions<T> extends IWhereConditions<T> {
  whereIn(column: string, values: any[]): T;
  whereNotIn(column: string, values: any[]): T;
  whereBetween(column: string, min: any, max: any): T;
  whereNull(column: string): T;
  whereNotNull(column: string): T;
  whereRaw(condition: string, ...values: SqlValue[]): T;
}

/**
 * Interface para encadenamiento lógico de condiciones
 */
export interface ILogicalChaining<T> {
  and(column: string, operator: SqlOperator, value: SqlValue): T;
  and(column: string, value: SqlValue): T;
  or(column: string, operator: SqlOperator, value: SqlValue): T;
  or(column: string, value: SqlValue): T;
}

// === INTERFACES PARA SELECT QUERIES ===
// Principio: Composición sobre herencia

/**
 * Interface para selección de columnas
 */
export interface IColumnSelection<T> {
  select(columns: string | string[]): T;
  selectRaw(rawSelect: string): T;
  columns(columns: string | string[]): T;
}

/**
 * Interface para especificación de tablas
 */
export interface ITableSpecification<T> {
  from(table: string): T;
  fromRaw(rawFrom: string): T;
}

/**
 * Interface para operaciones JOIN
 */
export interface IJoinOperations<T> {
  join(table: string, onCondition: string): T;
  leftJoin(table: string, onCondition: string): T;
  rightJoin(table: string, onCondition: string): T;
  innerJoin(table: string, onCondition: string): T;
  fullJoin(table: string, onCondition: string): T;
}

/**
 * Interface para ordenamiento
 */
export interface IOrderingOperations<T> {
  orderBy(column: string, direction?: OrderDirection): T;
  thenBy(column: string, direction?: OrderDirection): T;
}

/**
 * Interface para agrupación
 */
export interface IGroupingOperations<T> {
  groupBy(...columns: string[]): T;
  having(condition: string): T;
}

/**
 * Interface para limitación de resultados
 */
export interface ILimitingOperations<T> {
  limit(count: number): T;
  offset(count: number): T;
}

// === INTERFACES COMPUESTAS PARA OPERACIONES COMPLETAS ===
// Principio: Composición de interfaces pequeñas

/**
 * Interface completa para SELECT queries
 * Compuesta por múltiples interfaces específicas
 */
export interface ISelectQuery<T = any> extends 
  IQueryExecutable<T>,
  IColumnSelection<ISelectQuery<T>>,
  ITableSpecification<ISelectQuery<T>>,
  IAdvancedWhereConditions<ISelectQuery<T>>,
  ILogicalChaining<ISelectQuery<T>>,
  IJoinOperations<ISelectQuery<T>>,
  IOrderingOperations<ISelectQuery<T>>,
  IGroupingOperations<ISelectQuery<T>>,
  ILimitingOperations<ISelectQuery<T>> {}

/**
 * Interface para INSERT queries
 * Principio: Responsabilidad única - solo operaciones de inserción
 */
export interface IInsertQuery<T = any> extends IQueryExecutable<T>, IReturnable<T> {
  into(table: string): IInsertQuery<T>;
  value(column: string, value: any): IInsertQuery<T>;
  values(data: Record<string, any>): IInsertQuery<T>;
  multipleRows(rows: Record<string, any>[]): IInsertQuery<T>;
}

/**
 * Interface para UPDATE queries
 * Combina operaciones de actualización con condiciones WHERE
 */
export interface IUpdateQuery<T = any> extends 
  IQueryExecutable<T>,
  IReturnable<T>,
  IAdvancedWhereConditions<IUpdateQuery<T>> {
  table(tableName: string): IUpdateQuery<T>;
  set(column: string, value: any): IUpdateQuery<T>;
  set(values: Record<string, any>): IUpdateQuery<T>;
}

/**
 * Interface para DELETE queries
 * Combina operaciones de eliminación con condiciones WHERE
 */
export interface IDeleteQuery<T = any> extends 
  IQueryExecutable<T>,
  IReturnable<T>,
  IAdvancedWhereConditions<IDeleteQuery<T>> {
  from(tableName: string): IDeleteQuery<T>;
}

// === INTERFACE PRINCIPAL DEL CLIENTE ===
// Principio: Fachada - punto de entrada único y simple

/**
 * Interface principal del cliente EZql
 * Principio: Fachada que oculta la complejidad interna
 */
export interface IEZqlClient {
  // Factory methods para crear queries
  select<T = any>(): ISelectQuery<T>;
  select<T = any>(columns: string | string[]): ISelectQuery<T>;
  insert<T = any>(): IInsertQuery<T>;
  update<T = any>(): IUpdateQuery<T>;
  delete<T = any>(): IDeleteQuery<T>;
  
  // Operaciones especiales
  raw<T = any>(query: string, ...parameters: SqlValue[]): Promise<T[]>;
  transaction<T>(fn: (client: IEZqlClient) => Promise<T>): Promise<T>;
  
  // Gestión de conexión
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  healthCheck(): Promise<{ connected: boolean; serverTime?: Date; version?: string }>;
}

// === INTERFACES DE TRANSACCIÓN ===
// Principio: Segregación de interfaces para funcionalidades específicas

/**
 * Interface para manejo de transacciones
 */
export interface ITransactionManager {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isInTransaction(): boolean;
}

/**
 * Interface para cliente dentro de transacción
 */
export interface ITransactionalClient extends IEZqlClient {
  getTransaction(): ITransactionManager;
}

// === INTERFACES LEGACY PARA COMPATIBILIDAD ===
// Mantenidas para evitar breaking changes

export interface IFromQuery<T = any> extends ISelectQuery<T> {}
export interface IWhereQuery<T = any> extends ISelectQuery<T> {}
export interface IChainableQuery<T = any> extends ISelectQuery<T> {}
export interface IGroupCondition<T = any> extends ISelectQuery<T> {}
export interface IOrderableQuery<T = any> extends ISelectQuery<T> {}
export interface IGroupableQuery<T = any> extends ISelectQuery<T> {}
export interface ILimitableQuery<T = any> extends ISelectQuery<T> {}
