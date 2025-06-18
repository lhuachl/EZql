// === BOOTSTRAP DEL FRAMEWORK EZQL ===
// Sistema de registro automático de controladores usando metadata

import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import { EZqlClient } from '../core/EZqlClient';
import { HttpMethod, RouteMetadata, ControllerMetadata, ParameterMetadata } from './types';

// === SÍMBOLOS DE METADATA (deben coincidir con decorators.ts) ===
const CONTROLLER_METADATA = Symbol.for('ezql:controller');
const ROUTE_METADATA = Symbol.for('ezql:route');
const PARAMETER_METADATA = Symbol.for('ezql:parameter');

/**
 * Contexto de EZql para inyección en controladores
 */
export interface EZqlContext {
  db: EZqlClient;
  request: Request;
  response: Response;
  next: NextFunction;
}

/**
 * Bootstrap del framework EZql
 * Registra automáticamente todos los controladores con sus decoradores
 * 
 * @param app - Aplicación Express
 * @param controllers - Array de clases controladoras
 * @param dbClient - Cliente de base de datos EZql
 * 
 * @example
 * ```typescript
 * import { UsersController, ProductsController } from './controllers';
 * 
 * const app = express();
 * const dbClient = EZqlClient.create(config);
 * 
 * bootstrap(app, [UsersController, ProductsController], dbClient);
 * ```
 */
export function bootstrap(
  app: Express, 
  controllers: any[], 
  dbClient: EZqlClient
): void {
  console.log('🚀 Bootstrapping EZql controllers...');
  
  controllers.forEach(ControllerClass => {
    registerController(app, ControllerClass, dbClient);
  });
  
  console.log(`✅ ${controllers.length} controller(s) registered successfully`);
}

/**
 * Registra un controlador individual
 */
function registerController(
  app: Express, 
  ControllerClass: any, 
  dbClient: EZqlClient
): void {
  // Obtener metadata del controlador
  const controllerMetadata: ControllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA, ControllerClass);
  
  if (!controllerMetadata) {
    console.warn(`⚠️  ${ControllerClass.name} is not decorated with @Controller, skipping...`);
    return;
  }
  
  const controllerInstance = new ControllerClass();
  const prefix = controllerMetadata.prefix || '';
  
  console.log(`📋 Registering controller: ${ControllerClass.name} at ${prefix || '/'}`);
  
  // Obtener todos los métodos del controlador
  const prototype = ControllerClass.prototype;
  const methodNames = Object.getOwnPropertyNames(prototype)
    .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
  
  methodNames.forEach(methodName => {
    const routeMetadata: RouteMetadata = Reflect.getMetadata(ROUTE_METADATA, prototype, methodName);
    
    if (routeMetadata) {
      registerRoute(app, controllerInstance, methodName, routeMetadata, prefix, dbClient);
    }
  });
}

/**
 * Registra una ruta individual
 */
function registerRoute(
  app: Express,
  controllerInstance: any,
  methodName: string,
  routeMetadata: RouteMetadata,
  controllerPrefix: string,
  dbClient: EZqlClient
): void {
  const fullPath = (controllerPrefix + routeMetadata.path).replace(/\/+/g, '/');
  const httpMethod = routeMetadata.method.toLowerCase() as keyof Express;
  
  console.log(`   ${routeMetadata.method.padEnd(6)} ${fullPath} → ${controllerInstance.constructor.name}.${methodName}`);
  
  // Obtener metadata de parámetros
  const parameterMetadata: ParameterMetadata[] = 
    Reflect.getMetadata(PARAMETER_METADATA, controllerInstance, methodName) || [];
  
  // Crear el handler de la ruta
  const routeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Crear contexto
      const context: EZqlContext = {
        db: dbClient,
        request: req,
        response: res,
        next
      };
        // Resolver parámetros del método
      const args = await resolveMethodParameters(parameterMetadata, context);
      
      // Ejecutar el método del controlador
      const result = await controllerInstance[methodName](...args);
      
      // Si no se ha enviado respuesta aún, enviar el resultado
      if (!res.headersSent) {
        if (result !== undefined) {
          res.json(result);
        } else {
          res.status(204).send();
        }
      }
    } catch (error) {
      console.error(`❌ Error in ${controllerInstance.constructor.name}.${methodName}:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
  
  // Registrar la ruta en Express
  (app as any)[httpMethod](fullPath, routeHandler);
}

/**
 * Resuelve los parámetros de un método basándose en sus decoradores
 */
async function resolveMethodParameters(
  parameterMetadata: ParameterMetadata[],
  context: EZqlContext
): Promise<any[]> {
  const { db, request, response, next } = context;
  const sortedParams = parameterMetadata.sort((a, b) => a.index - b.index);
  const args: any[] = [];
  
  for (const param of sortedParams) {
    let value: any;
    
    switch (param.type) {
      case 'body':
        value = request.body;
        break;
      
      case 'param':
        value = param.name ? request.params[param.name] : request.params;
        break;
      
      case 'query':
        value = param.name ? request.query[param.name] : request.query;
        break;
      
      case 'header':
        value = param.name ? request.headers[param.name.toLowerCase()] : request.headers;
        break;
      
      case 'request':
        value = request;
        break;
      
      case 'response':
        value = response;
        break;
      
      case 'next':
        value = next;
        break;
      
      case 'db':
        value = db;
        break;
      
      case 'context':
        value = context;
        break;
      
      default:
        value = undefined;
    }
    
    // Aplicar transformador si existe
    if (param.transformer && value !== undefined) {
      value = param.transformer(value);
    }
    
    // Validar si es requerido
    if (param.required && (value === undefined || value === null)) {
      throw new Error(`Parameter '${param.name || param.type}' is required but not provided`);
    }
    
    // Aplicar validador si existe
    if (param.validator && value !== undefined) {
      try {
        const validationResult = param.validator(value);
        const result = validationResult instanceof Promise ? await validationResult : validationResult;
        if (result && typeof result === 'object' && 'isValid' in result && !result.isValid) {
          const errorMessage = result.errors?.map(e => e.message).join(', ') || 'Validation failed';
          throw new Error(`Validation failed for parameter '${param.name || param.type}': ${errorMessage}`);
        }
      } catch (validationError) {
        throw new Error(`Validation error for parameter '${param.name || param.type}': ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
      }
    }
    
    args[param.index] = value;
  }
  
  return args;
}

/**
 * Función de utilidad para obtener información de controladores registrados
 */
export function getControllersInfo(controllers: any[]): Array<{
  name: string;
  prefix: string;
  routes: Array<{
    method: string;
    path: string;
    handler: string;
  }>;
}> {
  return controllers.map(ControllerClass => {
    const controllerMetadata: ControllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA, ControllerClass);
    const prefix = controllerMetadata?.prefix || '';
    
    const prototype = ControllerClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
    
    const routes = methodNames
      .map(methodName => {
        const routeMetadata: RouteMetadata = Reflect.getMetadata(ROUTE_METADATA, prototype, methodName);
        if (routeMetadata) {
          return {
            method: routeMetadata.method,
            path: (prefix + routeMetadata.path).replace(/\/+/g, '/'),
            handler: `${ControllerClass.name}.${methodName}`
          };
        }
        return null;
      })
      .filter(Boolean);
    
    return {
      name: ControllerClass.name,
      prefix,
      routes: routes as any[]
    };
  });
}
