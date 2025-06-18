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
    const baseConfig: mssql.config = {
      server: config.server,
      database: config.database,
      port: config.port || 1433,
      options: {
        encrypt: config.encrypt ?? false,
        trustServerCertificate: config.trustServerCertificate ?? true,
        enableArithAbort: config.options?.enableArithAbort ?? true,
        requestTimeout: config.requestTimeout ?? 30000,
        connectTimeout: config.connectTimeout ?? 30000,
      },
      pool: {
        max: config.poolConfig?.max ?? 10,
        min: config.poolConfig?.min ?? 0,
        idleTimeoutMillis: config.poolConfig?.idleTimeoutMillis ?? 30000,
      },
    };    // ✅ Configurar autenticación según el tipo
    // Si se especifica autenticación NTLM, delegar a Tedious via propiedad authentication
    if (config.authentication?.type === 'ntlm' && config.authentication.options) {
      console.log('🔐 Configurando NTLM Windows Authentication');
      (baseConfig as any).authentication = { ...config.authentication };
    } else if (config.username && config.password) {
      // SQL Server Authentication
      console.log('🔐 Configurando SQL Server Authentication');
      baseConfig.user = config.username;
      baseConfig.password = config.password;
    } else {
      console.warn('⚠️ Sin credenciales - usando Windows Authentication por defecto');
    }

    return baseConfig;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    try {
      // Si se configuró driver msnodesqlv8, usarlo para Windows Auth
      if ((this.config as any).driver === 'msnodesqlv8') {
        const { ConnectionPool } = require('mssql/msnodesqlv8');
        this.pool = new ConnectionPool(this.config as any);
        console.log('🔗 Usando msnodesqlv8 para Windows Authentication');
      } else {
        this.pool = new mssql.ConnectionPool(this.config);
      }
      // Asegurar que this.pool no sea null
      if (!this.pool) {
        throw new EZqlError('Connection pool not initialized', 'NO_POOL');
      }
      const pool = this.pool;
      pool.on('error', (err) => console.error('❌ Connection pool error:', err));
      await pool.connect();
      console.log('✅ Connected to SQL Server successfully');
    } catch (error: any) {
      throw new EZqlError('Failed to connect to database', 'CONNECTION_ERROR', error);
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
