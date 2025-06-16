// === ABSTRACCIONES PRINCIPALES PARA INVERSIÓN DE DEPENDENCIAS ===
// Principio: Inversión de dependencias - interfaces no dependen de implementaciones concretas

import { QueryParameters, QueryResult, QueryStats, ValidationResult, EventData, EventHandler } from '../../types/core';

// === INTERFACES DE CONEXIÓN ===
// Principio: Segregación de interfaces por responsabilidad

/**
 * Interface para proveedores de conexión a base de datos
 * Principio: Abstracción que oculta detalles de implementación específicos
 */
export interface IConnectionProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Método mejorado que devuelve un tipo específico en lugar de 'any'
  getConnection(): unknown;
  
  // Métodos adicionales para mejor gestión
  healthCheck(): Promise<{ connected: boolean; serverTime?: Date; version?: string }>;
  getConnectionStats(): {
    connected: boolean;
    connecting: boolean;
    healthy: boolean;
  } | null;
}

/**
 * Interface para pool de conexiones
 * Principio: Responsabilidad única - manejo específico de pools
 */
export interface IConnectionPool extends IConnectionProvider {
  getPoolSize(): number;
  getActiveConnections(): number;
  getIdleConnections(): number;
  drain(): Promise<void>;
  clear(): Promise<void>;
}

// === INTERFACES DE EJECUCIÓN DE QUERIES ===

/**
 * Interface base para ejecución de queries
 * Principio: Interfaz común para diferentes tipos de ejecutores
 */
export interface IQueryExecutor {
  execute<T = any>(query: string, parameters?: QueryParameters): Promise<T[]>;
  executeScalar<T = any>(query: string, parameters?: QueryParameters): Promise<T>;
  executeNonQuery(query: string, parameters?: QueryParameters): Promise<number>;
}

/**
 * Interface extendida para ejecución con estadísticas
 * Principio: Extensión sin modificación (Open/Closed)
 */
export interface IQueryExecutorWithStats extends IQueryExecutor {
  executeWithStats<T = any>(query: string, parameters?: QueryParameters): Promise<QueryResult<T>>;
  getLastExecutionStats(): QueryStats | null;
}

/**
 * Interface para ejecución transaccional
 * Principio: Segregación - funcionalidad específica de transacciones
 */
export interface ITransactionalExecutor extends IQueryExecutor {
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  isInTransaction(): boolean;
}

// === INTERFACES DE CONSTRUCCIÓN DE QUERIES ===

/**
 * Interface base para constructores de queries
 * Principio: Responsabilidad única - solo construcción de SQL
 */
export interface IQueryBuilder<TQuery = string, TParams = QueryParameters> {
  build(): { sql: TQuery; parameters: TParams };
  reset(): void;
  clone(): IQueryBuilder<TQuery, TParams>;
}

/**
 * Interface para builders con validación
 * Principio: Extensión de funcionalidad sin modificar la base
 */
export interface IValidatedQueryBuilder<TQuery = string, TParams = QueryParameters> 
  extends IQueryBuilder<TQuery, TParams> {
  validate(): ValidationResult;
  isValid(): boolean;
}

/**
 * Interface para builders parametrizables
 * Principio: Flexibilidad en el manejo de parámetros
 */
export interface IParameterizedQueryBuilder<TQuery = string, TParams = QueryParameters> 
  extends IQueryBuilder<TQuery, TParams> {
  getParameters(): TParams;
  addParameter(name: string, value: any): void;
  clearParameters(): void;
}

// === INTERFACES DE VALIDACIÓN ===

/**
 * Interface genérica para validadores
 * Principio: Responsabilidad única - solo validación
 */
export interface IValidator<T> {
  validate(input: T): ValidationResult;
  isValid(input: T): boolean;
}

/**
 * Interface para validadores de queries SQL
 * Principio: Especialización para validación específica
 */
export interface ISqlValidator extends IValidator<string> {
  validateSyntax(sql: string): ValidationResult;
  validateSecurity(sql: string): ValidationResult;
  validatePerformance(sql: string): ValidationResult;
}

/**
 * Interface para validadores de schemas
 */
export interface ISchemaValidator<T> extends IValidator<T> {
  validateSchema(data: unknown): data is T;
  getSchemaErrors(data: unknown): string[];
}

// === INTERFACES DE CACHE ===

/**
 * Interface para proveedores de caché
 * Principio: Abstracción para diferentes implementaciones de caché
 */
export interface ICacheProvider<TKey = string, TValue = any> {
  get(key: TKey): Promise<TValue | null>;
  set(key: TKey, value: TValue, ttl?: number): Promise<void>;
  delete(key: TKey): Promise<boolean>;
  clear(): Promise<void>;
  exists(key: TKey): Promise<boolean>;
  getStats(): {
    hits: number;
    misses: number;
    size: number;
  };
}

/**
 * Interface para cache de queries específicamente
 */
export interface IQueryCache extends ICacheProvider<string, any[]> {
  getCacheKey(sql: string, parameters: QueryParameters): string;
  invalidateByPattern(pattern: string): Promise<void>;
}

// === INTERFACES DE LOGGING ===

/**
 * Interface para loggers
 * Principio: Abstracción para diferentes sistemas de logging
 */
export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

/**
 * Interface específica para logging de queries
 */
export interface IQueryLogger extends ILogger {
  logQuery(sql: string, parameters: QueryParameters, executionTime: number): void;
  logSlowQuery(sql: string, parameters: QueryParameters, executionTime: number): void;
  logQueryError(sql: string, parameters: QueryParameters, error: Error): void;
}

// === INTERFACES DE EVENTOS ===

/**
 * Interface para emisores de eventos
 * Principio: Observer pattern para desacoplamiento
 */
export interface IEventEmitter {
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  emit(event: string, data: EventData): void;
  removeAllListeners(event?: string): void;
}

/**
 * Interface para listeners de eventos
 */
export interface IEventListener {
  handleEvent(event: EventData): void | Promise<void>;
  getSubscribedEvents(): string[];
}

// === INTERFACES DE MIGRACIÓN ===

/**
 * Interface para migraciones de base de datos
 * Principio: Responsabilidad única - manejo de cambios de schema
 */
export interface IMigration {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  
  up(): Promise<void>;
  down(): Promise<void>;
}

/**
 * Interface para ejecutores de migraciones
 */
export interface IMigrationRunner {
  run(migrations: IMigration[]): Promise<void>;
  rollback(steps?: number): Promise<void>;
  getCurrentVersion(): Promise<number>;
  getPendingMigrations(): Promise<IMigration[]>;
}

// === INTERFACES DE CONFIGURACIÓN ===

/**
 * Interface para proveedores de configuración
 * Principio: Abstracción de fuentes de configuración
 */
export interface IConfigProvider<T = any> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  has<K extends keyof T>(key: K): boolean;
  reload(): Promise<void>;
}

// === FACTORY INTERFACES ===

/**
 * Interface para factories de componentes
 * Principio: Factory pattern para creación de objetos
 */
export interface IFactory<T> {
  create(...args: any[]): T;
  createAsync(...args: any[]): Promise<T>;
}

/**
 * Factory específica para query builders
 */
export interface IQueryBuilderFactory {
  createSelectBuilder(): IQueryBuilder;
  createInsertBuilder(): IQueryBuilder;
  createUpdateBuilder(): IQueryBuilder;
  createDeleteBuilder(): IQueryBuilder;
}

// === INTERFACES FLUENT BUILDERS ===

/**
 * Interface base para todos los builders fluent
 * Principio: Interfaz común para API fluida
 */
export interface IFluentBuilder<T> {
  execute(): Promise<T[]>;
  toSql(): { query: string; parameters: QueryParameters };
}

/**
 * Interface para builders con capacidades de clonación
 * Principio: Inmutabilidad en builders fluent
 */
export interface ICloneableBuilder<T> extends IFluentBuilder<T> {
  clone(): T;
}

// === INTERFACES DE MÉTRICAS ===

/**
 * Interface para recolección de métricas
 * Principio: Observabilidad y monitoreo
 */
export interface IMetricsCollector {
  incrementCounter(name: string, tags?: Record<string, string>): void;
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
  recordTimer(name: string, startTime: number, tags?: Record<string, string>): void;
}

// === TIPOS HELPER PARA DEPENDENCY INJECTION ===

/**
 * Token para inyección de dependencias
 */
export type InjectionToken<T = any> = string | symbol | (new (...args: any[]) => T);

/**
 * Interface para container de inyección de dependencias
 */
export interface IDependencyContainer {
  register<T>(token: InjectionToken<T>, implementation: T | (() => T)): void;
  resolve<T>(token: InjectionToken<T>): T;
  has<T>(token: InjectionToken<T>): boolean;
}

// === EXPORTS DE COMPATIBILIDAD ===

/**
 * @deprecated Use IQueryBuilder instead
 */
export interface ILegacyQueryBuilder extends IQueryBuilder {
  getParameters(): any[];
}

/**
 * @deprecated Use IConnectionProvider instead  
 */
export interface ILegacyConnectionProvider extends IConnectionProvider {
  getConnection(): any;
}
