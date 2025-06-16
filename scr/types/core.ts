// === TIPOS CENTRALIZADOS PARA EZQL ===
// Principio: Responsabilidad única - un lugar para todos los tipos core

// Re-export de configuraciones
export { ConnectionConfig, QueryConfig, EZqlError } from '../core/connection/config';

// === TIPOS PRIMITIVOS ===
// Principio: Tipos específicos y bien definidos

/**
 * Operadores SQL soportados
 * Principio: Enumeración exhaustiva de operadores válidos
 */
export type SqlOperator = 
  | '=' | '!=' | '<>' | '<' | '>' | '<=' | '>='
  | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'NOT ILIKE'
  | 'IN' | 'NOT IN'
  | 'IS NULL' | 'IS NOT NULL'
  | 'BETWEEN' | 'NOT BETWEEN'
  | 'EXISTS' | 'NOT EXISTS'
  | 'raw';

/**
 * Valores SQL válidos con tipos específicos
 * Principio: Tipado fuerte para prevenir errores
 */
export type SqlValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | null 
  | undefined 
  | any[] // Para operadores IN, BETWEEN, etc.
  | Buffer; // Para datos binarios

/**
 * Direcciones de ordenamiento
 */
export type OrderDirection = 'ASC' | 'DESC';

/**
 * Tipos de JOIN soportados
 */
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';

/**
 * Tipos de agregación disponibles
 */
export type AggregateFunction = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'GROUP_CONCAT';

// === INTERFACES PARA CONDICIONES ===
// Principio: Segregación de interfaces para diferentes tipos de condiciones

/**
 * Interface base para condiciones WHERE
 * Principio: Responsabilidad única - estructura básica de condición
 */
export interface BaseWhereCondition {
  column: string;
  operator: SqlOperator;
  connector?: 'AND' | 'OR';
  paramPlaceholder?: string;
}

/**
 * Condición WHERE simple
 */
export interface SimpleWhereCondition extends BaseWhereCondition {
  type: 'simple';
  value: SqlValue;
}

/**
 * Condición WHERE con SQL raw
 */
export interface RawWhereCondition extends BaseWhereCondition {
  type: 'raw';
  condition: string;
  value?: SqlValue;
}

/**
 * Condición WHERE para operadores IN/NOT IN
 */
export interface InWhereCondition extends BaseWhereCondition {
  type: 'in';
  value: any[];
}

/**
 * Condición WHERE para BETWEEN
 */
export interface BetweenWhereCondition extends BaseWhereCondition {
  type: 'between';
  value: [any, any];
}

/**
 * Condición WHERE para NULL checks
 */
export interface NullWhereCondition extends BaseWhereCondition {
  type: 'null';
  value: null;
}

/**
 * Union type para todas las condiciones WHERE
 * Principio: Polimorfismo a través de tipos union
 */
export type WhereCondition = 
  | SimpleWhereCondition 
  | RawWhereCondition 
  | InWhereCondition 
  | BetweenWhereCondition 
  | NullWhereCondition;

// === INTERFACES PARA CLÁUSULAS SQL ===
// Principio: Separación de responsabilidades por tipo de cláusula

/**
 * Cláusula ORDER BY
 */
export interface OrderByClause {
  column: string;
  direction: OrderDirection;
}

/**
 * Cláusula JOIN
 */
export interface JoinClause {
  type: JoinType;
  table: string;
  onCondition: string;
  alias?: string;
}

/**
 * Cláusula GROUP BY
 */
export interface GroupByClause {
  columns: string[];
  having?: string;
}

/**
 * Cláusula SELECT con agregaciones
 */
export interface SelectClause {
  columns: string[];
  aggregates?: {
    function: AggregateFunction;
    column: string;
    alias?: string;
  }[];
}

// === TIPOS PARA PARÁMETROS Y RESULTADOS ===

/**
 * Parámetros de query con tipado fuerte
 */
export type QueryParameters = Record<string, SqlValue>;

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  page?: number;
}

/**
 * Resultado de validación
 * Principio: Objeto de valor inmutable
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings?: readonly string[];
}

/**
 * Estadísticas de query
 */
export interface QueryStats {
  readonly executionTime: number;
  readonly rowsAffected: number;
  readonly queryHash: string;
  readonly timestamp: Date;
}

/**
 * Resultado de ejecución de query
 */
export interface QueryResult<T = any> {
  readonly data: T[];
  readonly stats: QueryStats;
  readonly sql: string;
  readonly parameters: QueryParameters;
}

// === INTERFACES PARA CONFIGURACIÓN ===

/**
 * Opciones de query específicas
 */
export interface QueryOptions {
  readonly timeout?: number;
  readonly retries?: number;
  readonly logQueries?: boolean;
  readonly enableStats?: boolean;
  readonly pagination?: PaginationOptions;
}

/**
 * Configuración de caché
 */
export interface CacheConfig {
  readonly enabled: boolean;
  readonly ttl: number;
  readonly keyPrefix?: string;
  readonly maxSize?: number;
}

/**
 * Configuración de logging
 */
export interface LoggingConfig {
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly enableQueryLogging: boolean;
  readonly enablePerformanceLogging: boolean;
  readonly logSlowQueries: boolean;
  readonly slowQueryThreshold: number;
}

// === TIPOS PARA EVENTOS ===
// Principio: Observer pattern para extensibilidad

/**
 * Tipos de eventos del sistema
 */
export type EventType = 
  | 'query.start'
  | 'query.complete'
  | 'query.error'
  | 'connection.open'
  | 'connection.close'
  | 'connection.error'
  | 'transaction.start'
  | 'transaction.commit'
  | 'transaction.rollback';

/**
 * Datos del evento
 */
export interface EventData {
  readonly type: EventType;
  readonly timestamp: Date;
  readonly data: any;
  readonly metadata?: Record<string, any>;
}

/**
 * Handler de eventos
 */
export type EventHandler = (event: EventData) => void | Promise<void>;

// === TIPOS HELPER ===

/**
 * Tipo helper para hacer propiedades opcionales
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Tipo helper para extraer el tipo de retorno de una función async
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : never;

/**
 * Tipo helper para tipos no nulos
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

// === EXPORTS DE LEGACY TYPES ===
// Para compatibilidad con código existente

/**
 * @deprecated Use WhereCondition instead
 */
export type LegacyWhereCondition = WhereCondition;

/**
 * @deprecated Use QueryParameters instead
 */
export type LegacyQueryParameters = QueryParameters;
