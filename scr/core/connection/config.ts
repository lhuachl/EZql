// Configuración y tipos de conexión para EZql
export interface ConnectionConfig {
  server: string;
  database: string;
  username?: string;              // ✅ Opcional para Windows Authentication
  password?: string;              // ✅ Opcional para Windows Authentication
  port?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  requestTimeout?: number;
  connectTimeout?: number;
  // ✅ NUEVO: Opciones específicas para Windows Authentication
  options?: {
    trustedConnection?: boolean;
    integratedSecurity?: boolean;
    enableArithAbort?: boolean;
  };
  // ✅ NUEVO: Configuración alternativa de autenticación
  authentication?: {
    type?: 'default' | 'ntlm';
    options?: {
      domain?: string;
      userName?: string;
      password?: string;
    };
  };
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
