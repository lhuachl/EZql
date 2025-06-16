import * as mssql from 'mssql';
import { IConnectionProvider } from '../abstractions';
import { ConnectionConfig, EZqlError } from '../../types/core';

export class SqlServerConnectionProvider implements IConnectionProvider {
  private config: mssql.config;
  private pool: mssql.ConnectionPool | null = null;
  private isConnecting: boolean = false;

  constructor(config: ConnectionConfig) {
    this.config = this.buildMssqlConfig(config);
  }

  private buildMssqlConfig(config: ConnectionConfig): mssql.config {
    return {
      server: config.server,
      database: config.database,
      user: config.username,
      password: config.password,
      port: config.port || 1434,
      options: {
        encrypt: config.encrypt ?? true,
        trustServerCertificate: config.trustServerCertificate ?? true,
        enableArithAbort: true,
        requestTimeout: config.requestTimeout ?? 30000,
        connectTimeout: config.connectTimeout ?? 30000,
      },
      pool: {
        max: config.poolConfig?.max ?? 10,
        min: config.poolConfig?.min ?? 0,
        idleTimeoutMillis: config.poolConfig?.idleTimeoutMillis ?? 30000,
      },
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected()) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    
    try {
      this.pool = new mssql.ConnectionPool(this.config);
      
      this.pool.on('error', (err) => {
        console.error('❌ Connection pool error:', err);
      });

      await this.pool.connect();
      console.log('✅ Connected to SQL Server successfully');
    } catch (error: any) {
      throw new EZqlError(
        'Failed to connect to database',
        'CONNECTION_ERROR',
        error
      );
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.pool) return;

    try {
      await this.pool.close();
      console.log('🔌 Disconnected from SQL Server');
    } catch (error: any) {
      console.error('❌ Error disconnecting:', error.message);
    } finally {
      this.pool = null;
    }
  }

  isConnected(): boolean {
    return !!this.pool && this.pool.connected;
  }

  getConnection(): mssql.ConnectionPool {
    if (!this.isConnected() || !this.pool) {
      throw new EZqlError(
        'Database connection not established',
        'NO_CONNECTION'
      );
    }
    return this.pool;
  }

  async healthCheck(): Promise<{ connected: boolean; serverTime?: Date; version?: string }> {
    if (!this.isConnected()) {
      return { connected: false };
    }

    try {
      const request = this.getConnection().request();
      const result = await request.query('SELECT GETDATE() as ServerTime, @@VERSION as Version');
      
      return {
        connected: true,
        serverTime: result.recordset[0].ServerTime,
        version: result.recordset[0].Version
      };
    } catch (error) {
      return { connected: false };
    }
  }

  getConnectionStats() {
    if (!this.pool) return null;
    
    return {
      connected: this.pool.connected,
      connecting: this.pool.connecting,
      healthy: this.pool.healthy,
    };
  }
}
