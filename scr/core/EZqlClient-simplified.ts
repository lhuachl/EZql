// === CLIENTE PRINCIPAL EZQL ===
// Implementación simplificada y funcional

import { 
  SqlValue, 
  ConnectionConfig, 
  EZqlError, 
  QueryConfig,
  QueryParameters
} from '../types/core';
import { 
  IConnectionProvider, 
  IQueryExecutor
} from './abstractions';
import { SqlServerConnectionProvider } from './connection/SqlServerConnectionProvider';
import { SqlServerQueryExecutor } from './execution/SqlServerQueryExecutor';
import { SelectQueryBuilder } from './query/SelectQueryBuilder';
import { InsertQueryBuilder } from './query/InsertQueryBuilder';
import { UpdateQueryBuilder } from './query/UpdateQueryBuilder';
import { DeleteQueryBuilder } from './query/DeleteQueryBuilder';

/**
 * Cliente principal de EZql - Versión simplificada y funcional
 * Enfocado en la funcionalidad core sin abstracciones complejas
 */
export class EZqlClient {
  
  // === DEPENDENCIAS ===
  private readonly connectionProvider: IConnectionProvider;
  private readonly queryExecutor: IQueryExecutor;
  
  // === CONFIGURACIÓN ===
  private readonly queryConfig: QueryConfig;
  
  // === ESTADO INTERNO ===
  private isInitialized: boolean = false;

  /**
   * Constructor simplificado
   */
  constructor(
    connectionConfig: ConnectionConfig,
    queryConfig: QueryConfig = {}
  ) {
    this.queryConfig = queryConfig;
    
    // Crear dependencias
    this.connectionProvider = new SqlServerConnectionProvider(connectionConfig);
    this.queryExecutor = new SqlServerQueryExecutor(this.connectionProvider, queryConfig);
  }

  /**
   * Factory method estático
   */
  static create(
    connectionConfig: ConnectionConfig, 
    queryConfig: QueryConfig = {}
  ): EZqlClient {
    return new EZqlClient(connectionConfig, queryConfig);
  }

  // === GESTIÓN DE CONEXIÓN ===

  async connect(): Promise<void> {
    try {
      await this.connectionProvider.connect();
      this.isInitialized = true;
      
      if (this.queryConfig.logQueries) {
        console.log('✅ EZql client connected successfully');
      }
      
    } catch (error) {
      if (this.queryConfig.logQueries) {
        console.error('❌ Failed to connect EZql client:', (error as Error).message);
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.connectionProvider.disconnect();
      this.isInitialized = false;
      
      if (this.queryConfig.logQueries) {
        console.log('✅ EZql client disconnected successfully');
      }
      
    } catch (error) {
      if (this.queryConfig.logQueries) {
        console.error('❌ Error disconnecting EZql client:', (error as Error).message);
      }
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connectionProvider.isConnected() && this.isInitialized;
  }

  // === QUERY BUILDERS ===

  select<T = any>(): SelectQueryBuilder;
  select<T = any>(columns: string | string[]): SelectQueryBuilder;
  select<T = any>(columns?: string | string[]): SelectQueryBuilder {
    const query = new SelectQueryBuilder();
    
    if (columns) {
      return query.select(columns);
    }
    
    return query;
  }

  insert<T = any>(): InsertQueryBuilder {
    return new InsertQueryBuilder(this.queryExecutor);
  }

  update<T = any>(): UpdateQueryBuilder {
    return new UpdateQueryBuilder(this.queryExecutor);
  }

  delete<T = any>(): DeleteQueryBuilder {
    return new DeleteQueryBuilder(this.queryExecutor);
  }

  // === OPERACIONES DIRECTAS ===

  async execute<T = any>(query: string, parameters: QueryParameters = {}): Promise<T[]> {
    this.ensureConnected();
    return this.queryExecutor.execute<T>(query, parameters);
  }

  async executeScalar<T>(query: string, parameters: QueryParameters = {}): Promise<T> {
    this.ensureConnected();
    return this.queryExecutor.executeScalar<T>(query, parameters);
  }

  async executeNonQuery(query: string, parameters: QueryParameters = {}): Promise<number> {
    this.ensureConnected();
    return this.queryExecutor.executeNonQuery(query, parameters);
  }

  async raw<T = any>(query: string, ...parameters: SqlValue[]): Promise<T[]> {
    this.ensureConnected();
    
    try {
      if (this.queryConfig.logQueries) {
        console.log('🔍 Executing raw query:', query);
        console.log('📋 Parameters:', parameters);
      }
      
      // Convert array parameters to QueryParameters format
      const queryParams: QueryParameters = {};
      parameters.forEach((param, index) => {
        queryParams[`param${index}`] = param;
      });
      
      const result = await this.queryExecutor.execute<T>(query, queryParams);
      
      if (this.queryConfig.logQueries) {
        console.log('✅ Raw query completed');
      }
      
      return result;
      
    } catch (error) {
      if (this.queryConfig.logQueries) {
        console.error('❌ Raw query failed:', (error as Error).message);
      }
      throw error;
    }
  }

  // === TRANSACCIONES SIMPLIFICADAS ===

  async transaction<T>(fn: (client: EZqlClient) => Promise<T>): Promise<T> {
    this.ensureConnected();
    
    try {
      if (this.queryConfig.logQueries) {
        console.log('🔄 Starting transaction');
      }
      
      // Por ahora, delegamos al cliente normal
      // En una implementación completa, esto manejaría transacciones reales
      const result = await fn(this);
      
      if (this.queryConfig.logQueries) {
        console.log('✅ Transaction completed');
      }
      
      return result;
      
    } catch (error) {
      if (this.queryConfig.logQueries) {
        console.error('❌ Transaction failed:', (error as Error).message);
      }
      throw error;
    }
  }

  // === MÉTODOS DE UTILIDAD ===

  async healthCheck(): Promise<{ connected: boolean; serverTime?: Date; version?: string }> {
    this.ensureConnected();
    return await this.connectionProvider.healthCheck();
  }

  getConnectionStats(): any {
    return this.connectionProvider.getConnectionStats();
  }

  updateQueryConfig(config: Partial<QueryConfig>): void {
    Object.assign(this.queryConfig, config);
  }

  getQueryConfig(): QueryConfig {
    return { ...this.queryConfig };
  }

  /**
   * Obtiene estadísticas básicas del cliente
   */
  getClientStats(): {
    isConnected: boolean;
    isInitialized: boolean;
  } {
    return {
      isConnected: this.isConnected(),
      isInitialized: this.isInitialized
    };
  }

  /**
   * Limpia recursos y prepara para disposal
   */
  async dispose(): Promise<void> {
    await this.disconnect();
  }

  // === MÉTODOS PRIVADOS ===

  private ensureConnected(): void {
    if (!this.isConnected()) {
      throw new EZqlError(
        'EZql client is not connected. Call connect() first.',
        'NOT_CONNECTED'
      );
    }
  }
}
