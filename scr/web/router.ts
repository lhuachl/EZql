// === MOTOR DE ROUTING PARA FRAMEWORK WEB ===
// Principio: Responsabilidad única - manejo de rutas y middlewares

import express, { Router, Request, Response, NextFunction } from 'express';
import { EZqlClient } from '../core/EZqlClient';
import { DIContainer, getContainer } from './di-container';
import { 
  getControllerMetadata, 
  getControllerRoutes, 
  getParameterMetadata 
} from './decorators';
import { 
  EZqlContext, 
  ParameterMetadata, 
  RouteMetadata, 
  ControllerMetadata,
  EZqlWebError,
  ApiResponse,
  Constructor
} from './types';

/**
 * Router principal del framework EZql Web
 * Principio: Facade pattern para simplificar configuración de rutas
 */
export class EZqlRouter {
  private router: Router;
  private container: DIContainer;
  private ezqlClient?: EZqlClient;
  
  constructor() {
    this.router = Router();
    this.container = getContainer();
  }
  
  /**
   * Configura el cliente EZql para inyección automática
   */
  setEZqlClient(client: EZqlClient): void {
    this.ezqlClient = client;
    
    // Registrar en el container DI
    this.container.register('EZqlClient', client);
    this.container.register('DATABASE', client);
    this.container.register('DB', client);
  }
  
  /**
   * Registra un controlador y sus rutas
   */
  registerController(controllerClass: Constructor): void {
    const controllerMetadata = getControllerMetadata(controllerClass);
    if (!controllerMetadata) {
      throw new Error(`Class ${controllerClass.name} is not decorated with @Controller`);
    }
    
    // Crear instancia del controlador usando DI
    const controllerInstance = this.container.resolve(controllerClass);
    
    // Registrar rutas del controlador
    const routes = getControllerRoutes(controllerClass);
    
    for (const route of routes) {
      this.registerRoute(
        controllerInstance,
        route.method,
        route.metadata,
        route.parameters,
        controllerMetadata
      );
    }
  }
  
  /**
   * Registra múltiples controladores
   */
  registerControllers(controllerClasses: Constructor[]): void {
    for (const controllerClass of controllerClasses) {
      this.registerController(controllerClass);
    }
  }
  
  /**
   * Obtiene el router de Express configurado
   */
  getRouter(): Router {
    return this.router;
  }
  
  // === MÉTODOS PRIVADOS ===
    private registerRoute(
    controllerInstance: any,
    methodName: string,
    routeMetadata: RouteMetadata,
    parameters: ParameterMetadata[],
    controllerMetadata: ControllerMetadata
  ): void {
    const fullPath = this.buildFullPath(controllerMetadata.prefix, routeMetadata.path);
    const method = routeMetadata.method.toLowerCase();
    
    // Combinar middlewares del controlador y del método
    const middlewares = [
      ...controllerMetadata.middlewares,
      ...(routeMetadata.middlewares || [])
    ];
    
    // Crear handler principal
    const handler = this.createRouteHandler(
      controllerInstance,
      methodName,
      parameters,
      routeMetadata
    );
    
    // Registrar ruta en Express usando el método correcto
    switch (method) {
      case 'get':
        this.router.get(fullPath, ...middlewares, handler);
        break;
      case 'post':
        this.router.post(fullPath, ...middlewares, handler);
        break;
      case 'put':
        this.router.put(fullPath, ...middlewares, handler);
        break;
      case 'patch':
        this.router.patch(fullPath, ...middlewares, handler);
        break;
      case 'delete':
        this.router.delete(fullPath, ...middlewares, handler);
        break;
      case 'options':
        this.router.options(fullPath, ...middlewares, handler);
        break;
      case 'head':
        this.router.head(fullPath, ...middlewares, handler);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    console.log(`[EZql] Registered ${routeMetadata.method} ${fullPath} -> ${controllerInstance.constructor.name}.${methodName}`);
  }
  
  private buildFullPath(prefix: string, path: string): string {
    const cleanPrefix = prefix.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    if (cleanPath === '/') {
      return cleanPrefix || '/';
    }
    
    return `${cleanPrefix}${cleanPath}`;
  }
  
  private createRouteHandler(
    controllerInstance: any,
    methodName: string,
    parameters: ParameterMetadata[],
    routeMetadata: RouteMetadata
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const requestId = this.generateRequestId();
      
      try {
        // Crear contexto de ejecución
        const context: EZqlContext = {
          request: req,
          response: res,
          next,
          db: this.ezqlClient!,
          params: req.params,
          query: req.query,
          body: req.body,
          headers: req.headers as Record<string, any>,
          metadata: { requestId }
        };
        
        // Validar request si hay validadores
        await this.validateRequest(context, routeMetadata);
        
        // Resolver parámetros del método
        const args = await this.resolveMethodParameters(parameters, context, requestId);
        
        // Ejecutar método del controlador
        let result = await controllerInstance[methodName](...args);
        
        // Aplicar serializer si existe
        if (routeMetadata.serializer) {
          result = routeMetadata.serializer(result);
        }
        
        // Enviar respuesta formateada
        this.sendResponse(res, result);
        
      } catch (error) {
        this.handleError(error, req, res, next);
      } finally {
        // Limpiar scope de request
        this.container.clearRequestScope(requestId);
      }
    };
  }
  
  private async validateRequest(context: EZqlContext, routeMetadata: RouteMetadata): Promise<void> {
    const validators = routeMetadata.validators;
    if (!validators) return;
    
    // Validar body
    if (validators.body) {
      const bodyValidation = await validators.body(context.body);
      if (!bodyValidation.isValid) {
        throw new EZqlWebError(
          'Request body validation failed',
          400,
          'VALIDATION_ERROR',
          { errors: bodyValidation.errors }
        );
      }
    }
    
    // Validar query parameters
    if (validators.query) {
      const queryValidation = await validators.query(context.query);
      if (!queryValidation.isValid) {
        throw new EZqlWebError(
          'Query parameters validation failed',
          400,
          'VALIDATION_ERROR',
          { errors: queryValidation.errors }
        );
      }
    }
    
    // Validar route parameters
    if (validators.params) {
      const paramsValidation = await validators.params(context.params);
      if (!paramsValidation.isValid) {
        throw new EZqlWebError(
          'Route parameters validation failed',
          400,
          'VALIDATION_ERROR',
          { errors: paramsValidation.errors }
        );
      }
    }
  }
  
  private async resolveMethodParameters(
    parameters: ParameterMetadata[],
    context: EZqlContext,
    requestId: string
  ): Promise<any[]> {
    // Ordenar parámetros por índice
    const sortedParams = parameters.sort((a, b) => a.index - b.index);
    const args: any[] = [];
    
    for (const param of sortedParams) {
      let value: any;
      
      switch (param.type) {
        case 'body':
          value = context.body;
          break;
        
        case 'param':
          value = param.name ? context.params[param.name] : context.params;
          break;
        
        case 'query':
          value = param.name ? context.query[param.name] : context.query;
          break;
        
        case 'header':
          value = param.name ? context.headers[param.name] : context.headers;
          break;
        
        case 'request':
          value = context.request;
          break;
        
        case 'response':
          value = context.response;
          break;
        
        case 'next':
          value = context.next;
          break;
        
        case 'db':
          value = context.db;
          break;
        
        case 'context':
          value = context;
          break;
        
        default:
          throw new Error(`Unknown parameter type: ${param.type}`);
      }
      
      // Aplicar transformer si existe
      if (param.transformer) {
        value = param.transformer(value);
      }
      
      // Validar si es requerido
      if (param.required && (value === undefined || value === null)) {
        throw new EZqlWebError(
          `Required parameter '${param.name || param.type}' is missing`,
          400,
          'MISSING_PARAMETER'
        );
      }
      
      // Aplicar validador específico si existe
      if (param.validator) {
        const validation = await param.validator(value);
        if (!validation.isValid) {
          throw new EZqlWebError(
            `Parameter '${param.name || param.type}' validation failed`,
            400,
            'PARAMETER_VALIDATION_ERROR',
            { errors: validation.errors }
          );
        }
      }
      
      args[param.index] = value;
    }
    
    return args;
  }
  
  private sendResponse(res: Response, data: any): void {
    // Formatear respuesta estándar
    const response: ApiResponse = {
      success: true,
      data,
      timestamp: new Date()
    };
    
    res.json(response);
  }
  
  private handleError(error: any, req: Request, res: Response, next: NextFunction): void {
    console.error('[EZql Router] Error:', error);
    
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;
    
    if (error instanceof EZqlWebError) {
      statusCode = error.statusCode;
      code = error.code || 'WEB_ERROR';
      message = error.message;
      details = error.details;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = error.message;
      details = error.details;
    }
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: details?.errors,
      timestamp: new Date()
    };
    
    res.status(statusCode).json(response);
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// === UTILIDADES DE ROUTING ===

/**
 * Crea un router configurado para EZql
 */
export function createEZqlRouter(ezqlClient: EZqlClient): EZqlRouter {
  const router = new EZqlRouter();
  router.setEZqlClient(ezqlClient);
  return router;
}

/**
 * Middleware para inyección automática de EZqlClient
 */
export function ezqlMiddleware(client: EZqlClient) {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).db = client;
    (req as any).ezql = client;
    next();
  };
}

/**
 * Middleware de manejo de errores para EZql
 */
export function ezqlErrorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[EZql Error Handler]:', error);
    
    if (res.headersSent) {
      return next(error);
    }
    
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    
    if (error instanceof EZqlWebError) {
      statusCode = error.statusCode;
      code = error.code || 'WEB_ERROR';
      message = error.message;
    }
    
    const response: ApiResponse = {
      success: false,
      message,
      timestamp: new Date()
    };
    
    res.status(statusCode).json(response);
  };
}
