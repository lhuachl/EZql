// === TIPOS PARA EL FRAMEWORK WEB ===
// Principio: Definición centralizada de tipos para el subsistema web

import { Request, Response, NextFunction } from 'express';
import { QueryParameters } from '../types/core';

// === TIPOS BÁSICOS ===

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type RouteHandler = (req: Request, res: Response, next?: NextFunction) => Promise<any> | any;

export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export type ValidatorFunction<T = any> = (data: T) => ValidationResult | Promise<ValidationResult>;

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// === METADATOS DE DECORADORES ===

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  middlewares?: MiddlewareFunction[];
  validators?: {
    body?: ValidatorFunction;
    params?: ValidatorFunction;
    query?: ValidatorFunction;
  };
  serializer?: (data: any) => any;
  description?: string;
  summary?: string;
  tags?: string[];
}

export interface ControllerMetadata {
  prefix: string;
  middlewares: MiddlewareFunction[];
  description?: string;
  tags?: string[];
}

export interface ParameterMetadata {
  index: number;
  type: ParameterType;
  name?: string;
  validator?: ValidatorFunction;
  transformer?: (value: any) => any;
  required?: boolean;
}

export type ParameterType = 
  | 'body' 
  | 'param' 
  | 'query' 
  | 'header' 
  | 'request' 
  | 'response' 
  | 'next'
  | 'db'
  | 'context';

// === CONTEXTO DE EJECUCIÓN ===

export interface EZqlContext {
  request: Request;
  response: Response;
  next: NextFunction;
  db: any; // EZqlClient
  params: Record<string, any>;
  query: Record<string, any>;
  body: any;
  headers: Record<string, any>;
  user?: any;
  metadata?: Record<string, any>;
}

// === DTOs Y MODELOS ===

export interface BaseDto {
  validate?(): ValidationResult | Promise<ValidationResult>;
}

export interface CreateUserDto extends BaseDto {
  name: string;
  email: string;
  password?: string;
  active?: boolean;
}

export interface UpdateUserDto extends BaseDto {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
}

export interface QueryDto extends BaseDto {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
}

// === RESPUESTAS API ===

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationErrorDetail[];
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  metadata: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// === CONFIGURACIÓN DEL FRAMEWORK ===

export interface EZqlWebConfig {
  port?: number;
  host?: string;
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };
  rateLimit?: {
    windowMs?: number;
    max?: number;
  };
  validation?: {
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    transform?: boolean;
  };
  errorHandling?: {
    includeStackTrace?: boolean;
    logErrors?: boolean;
  };
  documentation?: {
    enabled?: boolean;
    path?: string;
    title?: string;
    version?: string;
  };
}

// === INYECCIÓN DE DEPENDENCIAS ===

export type Constructor<T = any> = new (...args: any[]) => T;

export type ServiceIdentifier<T = any> = string | symbol | Constructor<T>;

export interface ServiceMetadata {
  identifier: ServiceIdentifier;
  scope: ServiceScope;
  factory?: () => any;
  dependencies?: ServiceIdentifier[];
}

export type ServiceScope = 'singleton' | 'transient' | 'request';

// === MIDDLEWARE TYPES ===

export interface MiddlewareMetadata {
  order: number;
  global?: boolean;
  routes?: string[];
  methods?: HttpMethod[];
}

// === ERROR TYPES ===

export class EZqlWebError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'EZqlWebError';
  }
}

export class ValidationError extends EZqlWebError {
  constructor(
    message: string,
    public readonly errors: ValidationErrorDetail[],
    details?: any
  ) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends EZqlWebError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends EZqlWebError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends EZqlWebError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

// === HOOKS Y EVENTOS ===

export interface ControllerHooks {
  beforeAction?: (context: EZqlContext) => Promise<void> | void;
  afterAction?: (context: EZqlContext, result: any) => Promise<any> | any;
  onError?: (context: EZqlContext, error: Error) => Promise<void> | void;
}

export type EventType = 
  | 'controller.before'
  | 'controller.after'
  | 'controller.error'
  | 'route.before'
  | 'route.after'
  | 'route.error'
  | 'validation.error'
  | 'request.start'
  | 'request.end';

export interface WebEvent {
  type: EventType;
  timestamp: Date;
  data: any;
  context?: EZqlContext;
}

// === SWAGGER/OpenAPI TYPES ===

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
}
