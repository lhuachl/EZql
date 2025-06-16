// === CLIENTE PRINCIPAL EZQL ===
// Implementación mejorada siguiendo principios SOLID

import { 
  IEZqlClient, 
  ISelectQuery, 
  IInsertQuery, 
  IUpdateQuery, 
  IDeleteQuery 
} from '../types/fluent-interfaces-improved';
import { 
  SqlValue, 
  ConnectionConfig, 
  EZqlError, 
  QueryConfig,
  QueryResult,
  QueryParameters,
  EventData,
  EventHandler
} from '../types/core-improved';
import { 
  IConnectionProvider, 
  IQueryExecutor, 
  IEventEmitter,
  ILogger,
  IMetricsCollector,
  ICacheProvider
} from './abstractions/improved-index';
import { FluentSelectQuery } from '../builders/FluentSelectQuery';
import { FluentInsertQuery } from '../builders/FluentInsertQuery';
import { FluentUpdateQuery } from '../builders/FluentUpdateQuery';
import { FluentDeleteQuery } from '../builders/FluentDeleteQuery';

/**
 * Cliente principal de EZql con arquitectura mejorada
 * 
 * Principios SOLID aplicados:
 * - SRP: Responsabilidad única como punto de entrada
 * - OCP: Abierto a extensión a través de interfaces
 * - LSP: Implementa IEZqlClient correctamente
 * - ISP: Interfaces segregadas por funcionalidad
 * - DIP: Depende de abstracciones, no de implementaciones concretas
 */
export class EZqlClient implements IEZqlClient, IEventEmitter {
  
  // === DEPENDENCIAS INYECTADAS ===
  // Principio: Inversión de dependencias
  private readonly connectionProvider: IConnectionProvider;
  private readonly queryExecutor: IQueryExecutor;
  private readonly logger?: ILogger;
  private readonly metricsCollector?: IMetricsCollector;
  private readonly cacheProvider?: ICacheProvider;
  
  // === CONFIGURACIÓN ===
  private readonly queryConfig: QueryConfig;
  private readonly eventHandlers: Map<string, Set<EventHandler>> = new Map();
  
  // === ESTADO INTERNO ===
  private isInitialized: boolean = false;
  private connectionId: string;

  /**
   * Constructor con inyección de dependencias
   * Principio: Constructor injection para dependencias obligatorias
   */
  constructor(
    connectionProvider: IConnectionProvider,
    queryExecutor: IQueryExecutor,
    options: {
      queryConfig?: QueryConfig;
      logger?: ILogger;
      metricsCollector?: IMetricsCollector;
      cacheProvider?: ICacheProvider;
    } = {}
  ) {
    this.connectionProvider = connectionProvider;
    this.queryExecutor = queryExecutor;
    this.queryConfig = options.queryConfig || {};
    this.logger = options.logger;
    this.metricsCollector = options.metricsCollector;
    this.cacheProvider = options.cacheProvider;
    this.connectionId = this.generateConnectionId();
    
    this.setupEventListeners();
  }

  /**
   * Factory method estático
   * Principio: Factory pattern para simplificar creación
   */
  static create(
    connectionConfig: ConnectionConfig, 
    options: {
      queryConfig?: QueryConfig;
      logger?: ILogger;
      metricsCollector?: IMetricsCollector;
      cacheProvider?: ICacheProvider;
    } = {}
  ): EZqlClient {
    // Aquí se inyectarían las implementaciones concretas
    // En un sistema real, esto vendría de un DI container
    const connectionProvider = EZqlClient.createConnectionProvider(connectionConfig);
    const queryExecutor = EZqlClient.createQueryExecutor(connectionProvider, options.queryConfig);
    
    return new EZqlClient(connectionProvider, queryExecutor, options);
  }

  /**
   * Factory method para crear connection provider
   * Principio: Factory method pattern
   */
  private static createConnectionProvider(config: ConnectionConfig): IConnectionProvider {
    // Importación dinámica para evitar dependencias circulares
    const { SqlServerConnectionProvider } = require('./connection/SqlServerConnectionProvider');
    return new SqlServerConnectionProvider(config);
  }

  /**
   * Factory method para crear query executor
   */
  private static createQueryExecutor(
    connectionProvider: IConnectionProvider, 
    queryConfig?: QueryConfig
  ): IQueryExecutor {
    const { SqlServerQueryExecutor } = require('./execution/SqlServerQueryExecutor');
    return new SqlServerQueryExecutor(connectionProvider, queryConfig);
  }

  // === GESTIÓN DE CONEXIÓN ===
  // Principio: Responsabilidad única - delegación a connectionProvider

  async connect(): Promise<void> {
    try {
      this.emit('connection.start', { connectionId: this.connectionId });
      this.metricsCollector?.incrementCounter('ezql.connection.attempts');
      
      await this.connectionProvider.connect();
      this.isInitialized = true;
      
      this.emit('connection.open', { connectionId: this.connectionId });
      this.metricsCollector?.incrementCounter('ezql.connection.success');
      this.logger?.info('EZql client connected successfully', { connectionId: this.connectionId });
      
    } catch (error) {
      this.emit('connection.error', { error, connectionId: this.connectionId });
      this.metricsCollector?.incrementCounter('ezql.connection.errors');
      this.logger?.error('Failed to connect EZql client', error as Error, { connectionId: this.connectionId });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.emit('connection.close', { connectionId: this.connectionId });
      
      await this.connectionProvider.disconnect();
      this.isInitialized = false;
      
      this.logger?.info('EZql client disconnected successfully', { connectionId: this.connectionId });
      
    } catch (error) {
      this.logger?.error('Error disconnecting EZql client', error as Error, { connectionId: this.connectionId });
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connectionProvider.isConnected() && this.isInitialized;
  }

  async healthCheck(): Promise<{ connected: boolean; serverTime?: Date; version?: string }> {
    this.ensureConnected();
    return await this.connectionProvider.healthCheck();
  }

  // === QUERY BUILDERS ===
  // Principio: Factory method pattern para crear builders

  select<T = any>(): ISelectQuery<T>;
  select<T = any>(columns: string | string[]): ISelectQuery<T>;
  select<T = any>(columns?: string | string[]): ISelectQuery<T> {
    this.ensureConnected();
    
    const query = new FluentSelectQuery<T>(this.queryExecutor);
    
    if (columns) {
      return query.select(columns);
    }
    
    return query;
  }

  insert<T = any>(): IInsertQuery<T> {
    this.ensureConnected();
    return new FluentInsertQuery<T>(this.queryExecutor);
  }

  update<T = any>(): IUpdateQuery<T> {
    this.ensureConnected();
    return new FluentUpdateQuery<T>(this.queryExecutor);
  }

  delete<T = any>(): IDeleteQuery<T> {
    this.ensureConnected();
    return new FluentDeleteQuery<T>(this.queryExecutor);
  }

  // === OPERACIONES AVANZADAS ===
  async raw<T = any>(query: string, ...parameters: SqlValue[]): Promise<T[]> {
    this.ensureConnected();
    
    const startTime = Date.now();
    
    // Convert array parameters to QueryParameters object format
    const queryParameters: QueryParameters = {};
    parameters.forEach((param, index) => {
      queryParameters[`param${index}`] = param;
    });
    
    try {
      this.emit('query.start', { sql: query, parameters: queryParameters });
      this.logger?.debug('Executing raw query', { sql: query, parameters: queryParameters });
      
      const result = await this.queryExecutor.execute<T>(query, queryParameters);
      const executionTime = Date.now() - startTime;      
      this.emit('query.complete', { sql: query, parameters: queryParameters, result, executionTime });
      this.metricsCollector?.recordTimer('ezql.query.execution_time', executionTime);
      this.logger?.debug('Raw query completed', { sql: query, executionTime });
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.emit('query.error', { sql: query, parameters: queryParameters, error, executionTime });
      this.metricsCollector?.incrementCounter('ezql.query.errors');
      this.logger?.error('Raw query failed', error as Error, { sql: query, parameters: queryParameters });
      throw error;
    }
  }

  // === TRANSACCIONES ===
  // Principio: Responsabilidad única - delegación a transaction manager

  async transaction<T>(fn: (client: IEZqlClient) => Promise<T>): Promise<T> {
    this.ensureConnected();
    
    // Crear un cliente transaccional
    const transactionalClient = this.createTransactionalClient();
    
    try {
      this.emit('transaction.start', { connectionId: this.connectionId });
      this.logger?.debug('Starting transaction', { connectionId: this.connectionId });
      
      // Aquí se implementaría la lógica de transacciones
      // Por ahora, delegamos al cliente normal
      const result = await fn(transactionalClient);
      
      this.emit('transaction.commit', { connectionId: this.connectionId });
      this.logger?.debug('Transaction committed', { connectionId: this.connectionId });
      
      return result;
      
    } catch (error) {
      this.emit('transaction.rollback', { connectionId: this.connectionId, error });
      this.logger?.error('Transaction rolled back', error as Error, { connectionId: this.connectionId });
      throw error;
    }
  }

  // === EVENT EMITTER IMPLEMENTATION ===
  // Principio: Observer pattern para desacoplamiento

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const eventData: EventData = {
        type: event as any,
        timestamp: new Date(),
        data,
        metadata: { connectionId: this.connectionId }
      };
      
      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          this.logger?.error('Error in event handler', error as Error, { event, data });
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }

  // === MÉTODOS PRIVADOS ===
  // Principio: Encapsulación

  private ensureConnected(): void {
    if (!this.isConnected()) {
      throw new EZqlError(
        'EZql client is not connected. Call connect() first.',
        'NOT_CONNECTED'
      );
    }
  }

  private generateConnectionId(): string {
    return `ezql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Setup de listeners internos para métricas y logging
    this.on('query.complete', (event) => {
      this.metricsCollector?.incrementCounter('ezql.queries.total');
      this.metricsCollector?.recordHistogram('ezql.query.rows_returned', event.data.result?.length || 0);
    });
    
    this.on('query.error', () => {
      this.metricsCollector?.incrementCounter('ezql.queries.failed');
    });
  }

  private createTransactionalClient(): IEZqlClient {
    // Por ahora retornamos el mismo cliente
    // En una implementación completa, esto crearía un cliente con contexto transaccional
    return this;
  }

  // === MÉTODOS DE UTILIDAD ===

  /**
   * Obtiene estadísticas del cliente
   */
  getClientStats(): {
    connectionId: string;
    isConnected: boolean;
    isInitialized: boolean;
    eventListenerCount: number;
  } {
    return {
      connectionId: this.connectionId,
      isConnected: this.isConnected(),
      isInitialized: this.isInitialized,
      eventListenerCount: Array.from(this.eventHandlers.values())
        .reduce((total, handlers) => total + handlers.size, 0)
    };
  }

  /**
   * Limpia recursos y prepara para disposal
   */
  async dispose(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
  }
}
