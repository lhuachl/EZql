// === APLICACIÓN PRINCIPAL DEL FRAMEWORK WEB ===
// Principio: Facade pattern para configuración y bootstrapping

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { EZqlClient } from '../core/EZqlClient';
import { EZqlRouter, ezqlErrorHandler } from './router';
import { DIContainer, getContainer } from './di-container';
import { EZqlWebConfig, Constructor, EZqlWebError } from './types';

/**
 * Aplicación principal del framework EZql Web
 * Principio: Factory pattern para crear aplicaciones configuradas
 */
export class EZqlApplication {
  private app: Express;
  private router: EZqlRouter;
  private container: DIContainer;
  private config: EZqlWebConfig;
  private ezqlClient?: EZqlClient;
  
  constructor(config: EZqlWebConfig = {}) {
    this.app = express();
    this.router = new EZqlRouter();
    this.container = getContainer();
    this.config = {
      port: 3000,
      host: '0.0.0.0',
      cors: { origin: '*', credentials: true },
      validation: { whitelist: true, forbidNonWhitelisted: true, transform: true },
      errorHandling: { includeStackTrace: false, logErrors: true },
      documentation: { enabled: true, path: '/docs', title: 'EZql API', version: '1.0.0' },
      ...config
    };
    
    this.setupMiddlewares();
  }
  
  /**
   * Configura el cliente EZql
   */
  useEZql(client: EZqlClient): this {
    this.ezqlClient = client;
    this.router.setEZqlClient(client);
    
    // Registrar cliente en DI container
    this.container.register('EZqlClient', client);
    this.container.register('DATABASE', client);
    
    return this;
  }
  
  /**
   * Registra controladores
   */
  useControllers(controllers: Constructor[]): this {
    this.router.registerControllers(controllers);
    return this;
  }
  
  /**
   * Registra un controlador individual
   */
  useController(controller: Constructor): this {
    this.router.registerController(controller);
    return this;
  }
  
  /**
   * Agrega middleware global
   */
  useMiddleware(middleware: (req: Request, res: Response, next: NextFunction) => void): this {
    this.app.use(middleware);
    return this;
  }
  
  /**
   * Configura rutas adicionales
   */
  useRoutes(path: string, router: express.Router): this {
    this.app.use(path, router);
    return this;
  }
  
  /**
   * Inicia el servidor
   */
  async listen(): Promise<void> {
    // Registrar rutas del framework
    this.app.use(this.router.getRouter());
    
    // Setup error handling
    this.setupErrorHandling();
    
    // Conectar a la base de datos si existe
    if (this.ezqlClient && !this.ezqlClient.isConnected()) {
      await this.ezqlClient.connect();
      console.log('[EZql] Connected to database successfully');
    }
      return new Promise((resolve) => {
      const port = this.config.port || 3000;
      const host = this.config.host || '0.0.0.0';
      
      this.app.listen(port, host, () => {
        console.log(`[EZql] Server running on ${host}:${port}`);
        console.log(`[EZql] Documentation available at http://${host}:${port}${this.config.documentation?.path}`);
        resolve();
      });
    });
  }
  
  /**
   * Obtiene la aplicación Express subyacente
   */
  getExpressApp(): Express {
    return this.app;
  }
  
  /**
   * Obtiene el container de DI
   */
  getContainer(): DIContainer {
    return this.container;
  }
  
  /**
   * Obtiene estadísticas de la aplicación
   */
  getStats() {
    return {
      container: this.container.getStats(),
      config: this.config,
      connected: this.ezqlClient?.isConnected() || false
    };
  }
  
  /**
   * Obtiene el router de Express para configuraciones manuales
   */
  getRouter(): express.Router {
    return this.router.getRouter();
  }

  // === MÉTODOS PRIVADOS ===
  
  private setupMiddlewares(): void {
    // Security
    this.app.use(helmet());
    
    // Compression
    this.app.use(compression());
    
    // CORS
    if (this.config.cors) {
      this.app.use(cors(this.config.cors));
    }
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use(this.requestLogger());
    
    // Health check endpoint
    this.setupHealthCheck();
    
    // Documentation endpoint
    if (this.config.documentation?.enabled) {
      this.setupDocumentation();
    }
  }
  
  private requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[EZql] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      });
      
      next();
    };
  }
  
  private setupHealthCheck(): void {
    this.app.get('/health', async (req, res) => {
      try {
        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          database: {
            connected: this.ezqlClient?.isConnected() || false
          }
        };
        
        if (this.ezqlClient) {
          const dbHealth = await this.ezqlClient.healthCheck();
          health.database = { ...health.database, ...dbHealth };
        }
        
        res.json(health);
      } catch (error) {
        res.status(503).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }
  
  private setupDocumentation(): void {
    const docPath = this.config.documentation?.path || '/docs';
    
    this.app.get(docPath, (req, res) => {
      const docs = {
        title: this.config.documentation?.title || 'EZql API',
        version: this.config.documentation?.version || '1.0.0',
        description: 'API documentation for EZql Web Framework',
        endpoints: this.generateEndpointDocumentation(),
        schemas: this.generateSchemaDocumentation()
      };
      
      res.json(docs);
    });
    
    // Swagger UI HTML
    this.app.get(`${docPath}/ui`, (req, res) => {
      res.send(this.generateSwaggerUI(docPath));
    });
  }
  
  private generateEndpointDocumentation() {
    // Esta función sería más compleja en una implementación real
    // Por ahora, retornamos un ejemplo básico
    return {
      '/health': {
        method: 'GET',
        description: 'Health check endpoint',
        responses: {
          200: { description: 'Service is healthy' },
          503: { description: 'Service is unhealthy' }
        }
      }
    };
  }
  
  private generateSchemaDocumentation() {
    return {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'any' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    };
  }
  
  private generateSwaggerUI(docPath: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${this.config.documentation?.title || 'EZql API'}</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '${docPath}',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.presets.standalone
          ]
        });
      </script>
    </body>
    </html>
    `;
  }
  
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date()
      });
    });
    
    // Error handler
    this.app.use(ezqlErrorHandler());
  }
}

// === FACTORY FUNCTIONS ===

/**
 * Crea una aplicación EZql Web
 */
export function createEZqlApp(config?: EZqlWebConfig): EZqlApplication {
  return new EZqlApplication(config);
}

/**
 * Bootstraps una aplicación completa con configuración por defecto
 */
export async function bootstrap(options: {
  controllers: Constructor[];
  ezqlClient: EZqlClient;
  config?: EZqlWebConfig;
}): Promise<EZqlApplication> {
  const app = createEZqlApp(options.config)
    .useEZql(options.ezqlClient)
    .useControllers(options.controllers);
  
  await app.listen();
  return app;
}

// === MIDDLEWARE UTILITIES ===

/**
 * Middleware de autenticación simple
 */
export function authMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authorization = req.headers.authorization;
    
    if (!authorization) {
      res.status(401).json({
        success: false,
        message: 'Authorization header required',
        timestamp: new Date()
      });
      return;
    }
    
    // Aquí iría la lógica de validación del token
    // Por simplicidad, solo verificamos que existe
    (req as any).user = { id: 1, name: 'Test User' };
    next();
  };
}

/**
 * Middleware de logging de requests
 */
export function loggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  };
}

/**
 * Middleware de rate limiting
 */
export function rateLimitMiddleware(options: { windowMs?: number; max?: number } = {}) {
  const { windowMs = 15 * 60 * 1000, max = 100 } = options;
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    let requestInfo = requests.get(ip);
    
    if (!requestInfo || now > requestInfo.resetTime) {
      requestInfo = { count: 1, resetTime: now + windowMs };
    } else {
      requestInfo.count++;
    }
    
    requests.set(ip, requestInfo);
    
    if (requestInfo.count > max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        timestamp: new Date()
      });
    }
    
    next();
  };
}
