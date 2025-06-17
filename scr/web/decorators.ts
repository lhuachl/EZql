// === DECORADORES HTTP PARA CONTROLADORES ===
// Principio: Decoradores como metadata para configuración declarativa

import 'reflect-metadata';
import { HttpMethod, RouteMetadata, ControllerMetadata, ParameterMetadata, ParameterType, MiddlewareFunction, ValidatorFunction } from './types';

// === METADATOS DE REFLECTION ===

const CONTROLLER_METADATA = Symbol('ezql:controller');
const ROUTE_METADATA = Symbol('ezql:route');
const PARAMETER_METADATA = Symbol('ezql:parameter');
const MIDDLEWARE_METADATA = Symbol('ezql:middleware');

// === DECORADOR DE INYECCIÓN DE DEPENDENCIAS ===

/**
 * @Injectable - Marca una clase como inyectable en el contenedor DI
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private db: EZqlClient) {}
 * } * ```
 */

// === DECORADOR PRINCIPAL DE CONTROLADOR ===

/**
 * Decorador @Controller - Marca una clase como controlador HTTP
 * 
 * @param prefix - Prefijo de ruta para todos los endpoints del controlador
 * @param options - Opciones adicionales del controlador
 * 
 * @example
 * ```typescript
 * @Controller('/api/users')
 * export class UserController {
 *   // endpoints aquí
 * }
 * ```
 */
export function Controller(prefix: string = '', options: {
  description?: string;
  tags?: string[];
  middlewares?: MiddlewareFunction[];
} = {}) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    const metadata: ControllerMetadata = {
      prefix: prefix.startsWith('/') ? prefix : `/${prefix}`,
      middlewares: options.middlewares || [],
      description: options.description,
      tags: options.tags
    };
    
    Reflect.defineMetadata(CONTROLLER_METADATA, metadata, constructor);
    return constructor;
  };
}

// === DECORADORES DE MÉTODOS HTTP ===

/**
 * Crea un decorador para métodos HTTP
 */
function createMethodDecorator(method: HttpMethod) {
  return function(path: string = '', options: {
    middlewares?: MiddlewareFunction[];
    description?: string;
    summary?: string;
    tags?: string[];
  } = {}) {
    return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
      const metadata: RouteMetadata = {
        method,
        path: path.startsWith('/') ? path : `/${path}`,
        middlewares: options.middlewares,
        description: options.description,
        summary: options.summary,
        tags: options.tags
      };
      
      Reflect.defineMetadata(ROUTE_METADATA, metadata, target, propertyKey);
    };
  };
}

/**
 * @Get - Decorador para endpoints GET
 * 
 * @example
 * ```typescript
 * @Get('/profile/:id')
 * async getUser(@Param('id') id: string) {
 *   return await this.userService.findById(id);
 * }
 * ```
 */
export const Get = createMethodDecorator('GET');

/**
 * @Post - Decorador para endpoints POST
 * 
 * @example
 * ```typescript
 * @Post('/')
 * async createUser(@Body() userData: CreateUserDto) {
 *   return await this.userService.create(userData);
 * }
 * ```
 */
export const Post = createMethodDecorator('POST');

/**
 * @Put - Decorador para endpoints PUT
 */
export const Put = createMethodDecorator('PUT');

/**
 * @Delete - Decorador para endpoints DELETE
 */
export const Delete = createMethodDecorator('DELETE');

/**
 * @Patch - Decorador para endpoints PATCH
 */
export const Patch = createMethodDecorator('PATCH');

/**
 * @Options - Decorador para endpoints OPTIONS
 */
export const Options = createMethodDecorator('OPTIONS');

/**
 * @Head - Decorador para endpoints HEAD
 */
export const Head = createMethodDecorator('HEAD');

// === DECORADORES DE PARÁMETROS ===

/**
 * Crea un decorador de parámetro
 */
function createParameterDecorator(type: ParameterType) {
  return function(nameOrOptions?: string | { 
    name?: string; 
    required?: boolean; 
    validator?: ValidatorFunction; 
    transformer?: (value: any) => any 
  }) {
    return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
      const existingMetadata: ParameterMetadata[] = Reflect.getMetadata(PARAMETER_METADATA, target, propertyKey!) || [];
      
      let metadata: ParameterMetadata;
      
      if (typeof nameOrOptions === 'string') {
        metadata = {
          index: parameterIndex,
          type,
          name: nameOrOptions
        };
      } else {
        metadata = {
          index: parameterIndex,
          type,
          name: nameOrOptions?.name,
          required: nameOrOptions?.required,
          validator: nameOrOptions?.validator,
          transformer: nameOrOptions?.transformer
        };
      }
      
      existingMetadata.push(metadata);
      Reflect.defineMetadata(PARAMETER_METADATA, existingMetadata, target, propertyKey!);
    };
  };
}

/**
 * @Body - Inyecta el cuerpo de la petición
 * 
 * @example
 * ```typescript
 * @Post('/')
 * async create(@Body() data: CreateUserDto) {
 *   return await this.service.create(data);
 * }
 * ```
 */
export const Body = createParameterDecorator('body');

/**
 * @Param - Inyecta un parámetro de ruta
 * 
 * @example
 * ```typescript
 * @Get('/:id')
 * async findOne(@Param('id') id: string) {
 *   return await this.service.findById(id);
 * }
 * ```
 */
export const Param = createParameterDecorator('param');

/**
 * @Query - Inyecta parámetros de query string
 * 
 * @example
 * ```typescript
 * @Get('/')
 * async findAll(@Query() query: QueryDto) {
 *   return await this.service.findAll(query);
 * }
 * ```
 */
export const Query = createParameterDecorator('query');

/**
 * @Header - Inyecta un header específico
 * 
 * @example
 * ```typescript
 * @Get('/')
 * async findAll(@Header('authorization') auth: string) {
 *   // usar auth header
 * }
 * ```
 */
export const Header = createParameterDecorator('header');

/**
 * @Req - Inyecta el objeto Request completo
 */
export const Req = createParameterDecorator('request');

/**
 * @Res - Inyecta el objeto Response completo
 */
export const Res = createParameterDecorator('response');

/**
 * @Next - Inyecta la función next del middleware
 */
export const Next = createParameterDecorator('next');

/**
 * @Db - Inyecta la instancia de EZqlClient
 * 
 * @example
 * ```typescript
 * @Get('/')
 * async findAll(@Db() db: EZqlClient) {
 *   return await db.select().from('users').execute();
 * }
 * ```
 */
export const Db = createParameterDecorator('db');

/**
 * @Context - Inyecta el contexto completo de EZql
 * 
 * @example
 * ```typescript
 * @Get('/')
 * async findAll(@Context() ctx: EZqlContext) {
 *   const { db, query, user } = ctx;
 *   return await db.select().from('users').execute();
 * }
 * ```
 */
export const Context = createParameterDecorator('context');

// === DECORADORES DE MIDDLEWARE ===

/**
 * @UseMiddleware - Aplica middleware a un método o controlador
 * 
 * @example
 * ```typescript
 * @UseMiddleware(authMiddleware, loggingMiddleware)
 * @Get('/protected')
 * async getProtectedData() {
 *   return { message: 'Protected data' };
 * }
 * ```
 */
export function UseMiddleware(...middlewares: MiddlewareFunction[]) {
  return function(target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      // Aplicar a método específico
      const existingMetadata = Reflect.getMetadata(ROUTE_METADATA, target, propertyKey) || {};
      existingMetadata.middlewares = [...(existingMetadata.middlewares || []), ...middlewares];
      Reflect.defineMetadata(ROUTE_METADATA, existingMetadata, target, propertyKey);
    } else {
      // Aplicar a controlador completo
      const existingMetadata = Reflect.getMetadata(CONTROLLER_METADATA, target) || {};
      existingMetadata.middlewares = [...(existingMetadata.middlewares || []), ...middlewares];
      Reflect.defineMetadata(CONTROLLER_METADATA, existingMetadata, target);
    }
  };
}

// === DECORADORES DE VALIDACIÓN ===

/**
 * @ValidateBody - Valida el cuerpo de la petición
 * 
 * @example
 * ```typescript
 * @Post('/')
 * @ValidateBody(CreateUserDto)
 * async create(@Body() data: CreateUserDto) {
 *   return await this.service.create(data);
 * }
 * ```
 */
export function ValidateBody(validator: ValidatorFunction | Constructor) {
  return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(ROUTE_METADATA, target, propertyKey) || {};
    if (!existingMetadata.validators) {
      existingMetadata.validators = {};
    }
    
    existingMetadata.validators.body = typeof validator === 'function' && validator.prototype 
      ? (data: any) => validateDto(data, validator as Constructor)
      : validator as ValidatorFunction;
    
    Reflect.defineMetadata(ROUTE_METADATA, existingMetadata, target, propertyKey);
  };
}

/**
 * @ValidateQuery - Valida los parámetros de query
 */
export function ValidateQuery(validator: ValidatorFunction | Constructor) {
  return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(ROUTE_METADATA, target, propertyKey) || {};
    if (!existingMetadata.validators) {
      existingMetadata.validators = {};
    }
    
    existingMetadata.validators.query = typeof validator === 'function' && validator.prototype 
      ? (data: any) => validateDto(data, validator as Constructor)
      : validator as ValidatorFunction;
    
    Reflect.defineMetadata(ROUTE_METADATA, existingMetadata, target, propertyKey);
  };
}

/**
 * @ValidateParams - Valida los parámetros de ruta
 */
export function ValidateParams(validator: ValidatorFunction | Constructor) {
  return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(ROUTE_METADATA, target, propertyKey) || {};
    if (!existingMetadata.validators) {
      existingMetadata.validators = {};
    }
    
    existingMetadata.validators.params = typeof validator === 'function' && validator.prototype 
      ? (data: any) => validateDto(data, validator as Constructor)
      : validator as ValidatorFunction;
    
    Reflect.defineMetadata(ROUTE_METADATA, existingMetadata, target, propertyKey);
  };
}

// === DECORADORES DE SERIALIZACIÓN ===

/**
 * @Serialize - Serializa la respuesta
 * 
 * @example
 * ```typescript
 * @Get('/')
 * @Serialize((data) => ({ users: data, count: data.length }))
 * async findAll() {
 *   return await this.service.findAll();
 * }
 * ```
 */
export function Serialize(serializer: (data: any) => any) {
  return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(ROUTE_METADATA, target, propertyKey) || {};
    existingMetadata.serializer = serializer;
    Reflect.defineMetadata(ROUTE_METADATA, existingMetadata, target, propertyKey);
  };
}

// === DECORADORES DE DOCUMENTACIÓN ===

/**
 * @ApiOperation - Documenta la operación para Swagger
 */
export function ApiOperation(options: {
  summary?: string;
  description?: string;
  tags?: string[];
} | string) {
  return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const existingMetadata = Reflect.getMetadata(ROUTE_METADATA, target, propertyKey) || {};
    
    if (typeof options === 'string') {
      existingMetadata.summary = options;
      existingMetadata.description = options;
    } else {
      existingMetadata.summary = options.summary;
      existingMetadata.description = options.description;
      existingMetadata.tags = options.tags;
    }
    
    Reflect.defineMetadata(ROUTE_METADATA, existingMetadata, target, propertyKey);
  };
}

// === UTILIDADES DE REFLECTION ===

/**
 * Obtiene metadatos del controlador
 */
export function getControllerMetadata(constructor: any): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA, constructor);
}

/**
 * Obtiene metadatos de ruta
 */
export function getRouteMetadata(target: any, propertyKey: string): RouteMetadata | undefined {
  return Reflect.getMetadata(ROUTE_METADATA, target, propertyKey);
}

/**
 * Obtiene metadatos de parámetros
 */
export function getParameterMetadata(target: any, propertyKey: string): ParameterMetadata[] {
  return Reflect.getMetadata(PARAMETER_METADATA, target, propertyKey) || [];
}

/**
 * Obtiene todas las rutas de un controlador
 */
export function getControllerRoutes(constructor: any): Array<{
  method: string;
  metadata: RouteMetadata;
  parameters: ParameterMetadata[];
}> {
  const prototype = constructor.prototype;
  const methodNames = Object.getOwnPropertyNames(prototype).filter(name => 
    name !== 'constructor' && typeof prototype[name] === 'function'
  );
  
  return methodNames
    .map(methodName => {
      const metadata = getRouteMetadata(prototype, methodName);
      if (!metadata) return null;
      
      const parameters = getParameterMetadata(prototype, methodName);
      
      return {
        method: methodName,
        metadata,
        parameters
      };
    })
    .filter(Boolean) as Array<{
      method: string;
      metadata: RouteMetadata;
      parameters: ParameterMetadata[];
    }>;
}

// === VALIDACIÓN DE DTOs ===

interface Constructor<T = any> {
  new (...args: any[]): T;
}

/**
 * Valida un DTO usando class-validator style
 */
async function validateDto(data: any, DtoClass: Constructor): Promise<import('./types').ValidationResult> {
  try {
    // Crear instancia del DTO
    const instance = new DtoClass();
    Object.assign(instance, data);
    
    // Si el DTO tiene método validate, usarlo
    if (typeof (instance as any).validate === 'function') {
      return await (instance as any).validate();
    }
    
    // Validación básica por defecto
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'general',
        message: error instanceof Error ? error.message : 'Validation failed',
        code: 'VALIDATION_ERROR'
      }]
    };
  }
}
