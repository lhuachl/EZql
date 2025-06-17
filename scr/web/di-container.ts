// === SISTEMA DE INYECCIÓN DE DEPENDENCIAS ===
// Principio: Inversión de control y gestión automática de dependencias

import 'reflect-metadata';
import { ServiceIdentifier, ServiceMetadata, ServiceScope, Constructor } from './types';

// === METADATOS DE REFLECTION ===

const INJECTABLE_METADATA = Symbol('ezql:injectable');
const INJECT_METADATA = Symbol('ezql:inject');
const SERVICE_METADATA = Symbol('ezql:service');

// === CONTAINER DE DEPENDENCIAS ===

/**
 * Container de inyección de dependencias
 * Principio: Singleton pattern para gestión centralizada
 */
export class DIContainer {
  private static instance: DIContainer;
  
  private services = new Map<ServiceIdentifier, ServiceMetadata>();
  private instances = new Map<ServiceIdentifier, any>();
  private requestScoped = new Map<string, Map<ServiceIdentifier, any>>();
  
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
  
  /**
   * Registra un servicio en el container
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    implementation: Constructor<T> | T | (() => T),
    options: {
      scope?: ServiceScope;
      dependencies?: ServiceIdentifier[];
    } = {}
  ): void {
    const metadata: ServiceMetadata = {
      identifier,
      scope: options.scope || 'singleton',
      dependencies: options.dependencies || []
    };
    
    if (typeof implementation === 'function' && implementation.prototype) {
      // Es una clase constructor
      metadata.factory = () => this.createInstance(implementation as Constructor<T>);
    } else if (typeof implementation === 'function') {
      // Es una factory function
      metadata.factory = implementation as () => T;
    } else {
      // Es una instancia directa
      metadata.factory = () => implementation;
    }
    
    this.services.set(identifier, metadata);
  }
  
  /**
   * Resuelve una dependencia
   */
  resolve<T>(identifier: ServiceIdentifier<T>, requestId?: string): T {
    const metadata = this.services.get(identifier);
    if (!metadata) {
      throw new Error(`Service ${String(identifier)} not registered`);
    }
    
    switch (metadata.scope) {
      case 'singleton':
        return this.resolveSingleton(identifier, metadata);
      
      case 'transient':
        return this.resolveTransient(metadata);
      
      case 'request':
        if (!requestId) {
          throw new Error(`Request ID required for request-scoped service ${String(identifier)}`);
        }
        return this.resolveRequestScoped(identifier, metadata, requestId);
      
      default:
        throw new Error(`Unknown scope: ${metadata.scope}`);
    }
  }
  
  /**
   * Verifica si un servicio está registrado
   */
  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier);
  }
  
  /**
   * Limpia las instancias de un request específico
   */
  clearRequestScope(requestId: string): void {
    this.requestScoped.delete(requestId);
  }
  
  /**
   * Limpia todas las instancias singleton
   */
  clearSingletons(): void {
    this.instances.clear();
  }
  
  /**
   * Obtiene estadísticas del container
   */
  getStats() {
    return {
      registeredServices: this.services.size,
      singletonInstances: this.instances.size,
      activeRequestScopes: this.requestScoped.size
    };
  }
  
  // === MÉTODOS PRIVADOS ===
  
  private resolveSingleton<T>(identifier: ServiceIdentifier<T>, metadata: ServiceMetadata): T {
    if (this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }
    
    const instance = metadata.factory!();
    this.instances.set(identifier, instance);
    return instance;
  }
  
  private resolveTransient<T>(metadata: ServiceMetadata): T {
    return metadata.factory!();
  }
  
  private resolveRequestScoped<T>(
    identifier: ServiceIdentifier<T>, 
    metadata: ServiceMetadata, 
    requestId: string
  ): T {
    if (!this.requestScoped.has(requestId)) {
      this.requestScoped.set(requestId, new Map());
    }
    
    const requestScope = this.requestScoped.get(requestId)!;
    
    if (requestScope.has(identifier)) {
      return requestScope.get(identifier);
    }
    
    const instance = metadata.factory!();
    requestScope.set(identifier, instance);
    return instance;
  }
  
  private createInstance<T>(constructor: Constructor<T>): T {
    // Obtener dependencias del constructor
    const dependencies = this.getConstructorDependencies(constructor);
    
    // Resolver dependencias
    const resolvedDependencies = dependencies.map(dep => this.resolve(dep));
    
    // Crear instancia
    return new constructor(...resolvedDependencies);
  }
  
  private getConstructorDependencies(constructor: Constructor): ServiceIdentifier[] {
    // Obtener tipos de parámetros usando reflect-metadata
    const paramTypes = Reflect.getMetadata('design:paramtypes', constructor) || [];
    
    // Obtener decoradores @Inject específicos
    const injectMetadata = Reflect.getMetadata(INJECT_METADATA, constructor) || {};
    
    return paramTypes.map((type: any, index: number) => {
      // Si hay un @Inject específico, usarlo
      if (injectMetadata[index]) {
        return injectMetadata[index];
      }
      
      // Usar el tipo como identificador
      return type;
    });
  }
}

// === DECORADORES ===

/**
 * @Injectable - Marca una clase como injectable
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private db: EZqlClient) {}
 * }
 * ```
 */
export function Injectable(options: {
  scope?: ServiceScope;
} = {}) {
  return function<T extends Constructor>(constructor: T) {
    const metadata = {
      scope: options.scope || 'singleton'
    };
    
    Reflect.defineMetadata(INJECTABLE_METADATA, metadata, constructor);
    
    // Auto-registrar en el container
    const container = DIContainer.getInstance();
    container.register(constructor, constructor, { scope: options.scope });
    
    return constructor;
  };
}

/**
 * @Inject - Especifica una dependencia específica para inyectar
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @Inject('DATABASE') private db: EZqlClient,
 *     @Inject(LoggerService) private logger: LoggerService
 *   ) {}
 * }
 * ```
 */
export function Inject(identifier: ServiceIdentifier) {
  return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingMetadata = Reflect.getMetadata(INJECT_METADATA, target) || {};
    existingMetadata[parameterIndex] = identifier;
    Reflect.defineMetadata(INJECT_METADATA, existingMetadata, target);
  };
}

/**
 * @Service - Alias para @Injectable con scope singleton
 */
export function Service() {
  return Injectable({ scope: 'singleton' });
}

/**
 * @Transient - Marca una clase como transient scope
 */
export function Transient() {
  return Injectable({ scope: 'transient' });
}

/**
 * @RequestScoped - Marca una clase como request scoped
 */
export function RequestScoped() {
  return Injectable({ scope: 'request' });
}

// === UTILIDADES ===

/**
 * Obtiene la instancia del container
 */
export function getContainer(): DIContainer {
  return DIContainer.getInstance();
}

/**
 * Registra un servicio de forma fluida
 */
export function register<T>(identifier: ServiceIdentifier<T>) {
  return {
    to: (implementation: Constructor<T> | T | (() => T), scope: ServiceScope = 'singleton') => {
      const container = DIContainer.getInstance();
      container.register(identifier, implementation, { scope });
    }
  };
}

/**
 * Resuelve una dependencia de forma fluida
 */
export function resolve<T>(identifier: ServiceIdentifier<T>, requestId?: string): T {
  const container = DIContainer.getInstance();
  return container.resolve(identifier, requestId);
}

// === DECORADOR DE PROVIDER ===

/**
 * @Provider - Registra un provider personalizado
 * 
 * @example
 * ```typescript
 * @Provider('CONFIG')
 * export class ConfigProvider {
 *   static provide() {
 *     return {
 *       database: process.env.DATABASE_URL,
 *       port: parseInt(process.env.PORT || '3000')
 *     };
 *   }
 * }
 * ```
 */
export function Provider(identifier: ServiceIdentifier, options: {
  scope?: ServiceScope;
  factory?: string; // nombre del método factory
} = {}) {
  return function<T extends Constructor>(constructor: T) {
    const container = DIContainer.getInstance();
    const factoryMethod = options.factory || 'provide';
    
    if (typeof (constructor as any)[factoryMethod] === 'function') {
      container.register(identifier, (constructor as any)[factoryMethod], {
        scope: options.scope || 'singleton'
      });
    } else {
      throw new Error(`Factory method ${factoryMethod} not found in ${constructor.name}`);
    }
    
    return constructor;
  };
}

// === MÓDULO DE CONFIGURACIÓN ===

/**
 * @Module - Configura un módulo de dependencias
 * 
 * @example
 * ```typescript
 * @Module({
 *   providers: [UserService, EmailService],
 *   controllers: [UserController],
 *   exports: [UserService]
 * })
 * export class UserModule {}
 * ```
 */
export function Module(options: {
  providers?: Array<Constructor | { provide: ServiceIdentifier; useClass?: Constructor; useValue?: any; useFactory?: () => any; scope?: ServiceScope }>;
  controllers?: Constructor[];
  exports?: ServiceIdentifier[];
  imports?: Constructor[];
}) {
  return function<T extends Constructor>(constructor: T) {
    const container = DIContainer.getInstance();
    
    // Registrar providers
    if (options.providers) {
      for (const provider of options.providers) {
        if (typeof provider === 'function') {
          // Es una clase
          container.register(provider, provider);
        } else {
          // Es un objeto de configuración
          if (provider.useClass) {
            container.register(provider.provide, provider.useClass, { scope: provider.scope });
          } else if (provider.useValue !== undefined) {
            container.register(provider.provide, provider.useValue, { scope: provider.scope });
          } else if (provider.useFactory) {
            container.register(provider.provide, provider.useFactory, { scope: provider.scope });
          }
        }
      }
    }
    
    // Los controladores se registran automáticamente por el sistema de routing
    
    return constructor;
  };
}
