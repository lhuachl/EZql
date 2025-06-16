import { IQueryExecutor, IConnectionProvider } from '../abstractions';
import { EZqlError, QueryConfig, QueryParameters } from '../../types/core';

export class SqlServerQueryExecutor implements IQueryExecutor {
  constructor(
    private connectionProvider: IConnectionProvider,
    private config: QueryConfig = {}
  ) {}

  async execute<T>(query: string, parameters: QueryParameters = {}): Promise<T[]> {
    this.validateConnection();
    
    const startTime = Date.now();
    
    try {
      if (this.config.logQueries) {
        console.log('🔍 Executing SQL:', query);
        console.log('📋 Parameters:', parameters);
      }

      const connection = this.connectionProvider.getConnection() as any;
      const request = connection.request();
      
      // Configurar timeout si está especificado
      if (this.config.timeout) {
        request.timeout = this.config.timeout;
      }

      // Bind parameters
      if (Array.isArray(parameters)) {
        // Legacy array format
        parameters.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      } else {
        // New object format
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      const result = await request.query(query);
      
      if (this.config.logQueries) {
        console.log(`⏱️ Query executed in ${Date.now() - startTime}ms`);
      }

      return result.recordset || [];
    } catch (error: any) {
      throw new EZqlError(
        `Query execution failed: ${error.message}`,
        'EXECUTION_ERROR',
        error
      );
    }
  }

  async executeScalar<T>(query: string, parameters: QueryParameters = {}): Promise<T> {
    const results = await this.execute<any>(query, parameters);
    
    if (results.length === 0) {
      throw new EZqlError('Scalar query returned no results', 'NO_RESULTS');
    }
    
    const firstRow = results[0];
    const firstColumn = Object.keys(firstRow)[0];
    
    return firstRow[firstColumn] as T;
  }
  async executeNonQuery(query: string, parameters: QueryParameters = {}): Promise<number> {
    this.validateConnection();
    
    try {
      if (this.config.logQueries) {
        console.log('🔍 Executing Non-Query SQL:', query);
        console.log('📋 Parameters:', parameters);
      }

      const connection = this.connectionProvider.getConnection() as any;
      const request = connection.request();
      
      if (this.config.timeout) {
        request.timeout = this.config.timeout;
      }

      // Bind parameters
      if (Array.isArray(parameters)) {
        // Legacy array format
        parameters.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      } else {
        // New object format
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      const result = await request.query(query);
      return result.rowsAffected[0] || 0;
    } catch (error: any) {
      throw new EZqlError(
        `Non-query execution failed: ${error.message}`,
        'EXECUTION_ERROR',
        error
      );
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (this.config.logQueries) {
          console.warn(`🔄 Attempt ${attempt} failed:`, error.message);
        }
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new EZqlError(
      `Operation failed after ${maxRetries} attempts`,
      'RETRY_EXHAUSTED',
      lastError!
    );
  }

  private validateConnection(): void {
    if (!this.connectionProvider.isConnected()) {
      throw new EZqlError(
        'Database connection not established',
        'NO_CONNECTION'
      );
    }
  }
}
