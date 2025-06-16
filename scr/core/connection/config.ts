// Configuración y tipos de conexión para EZql
export interface ConnectionConfig {
  server: string;
  database: string;
  username: string;
  password: string;
  port?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  requestTimeout?: number;
  connectTimeout?: number;
  poolConfig?: {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
  };
}

export interface QueryConfig {
  timeout?: number;
  retries?: number;
  logQueries?: boolean;
}

// Error personalizado
export class EZqlError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'EZqlError';
  }
}
