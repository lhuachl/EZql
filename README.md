# � EZql Framework - Modern TypeScript Web Framework

> **✅ ESTADO ACTUAL: Versión 1.0.0 - Completamente Funcional**  
> Framework web moderno con ORM integrado, decoradores HTTP y dependency injection automática.  
> **Implementación actual**: 100% completada y funcional  
> **Características**: Similar a NestJS/Spring Boot con sintaxis declarativa

[![Development Status](https://img.shields.io/badge/Status-Stable-green.svg)](https://github.com/lhuachl/EZql)
[![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg)](https://github.com/lhuachl/EZql/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🎯 **Framework Completamente Funcional**

| Componente | Estado | Características |
|------------|--------|-----------------|
| 🎨 **Decoradores HTTP** | ✅ **Completo** | `@Controller`, `@Get`, `@Post`, `@Put`, `@Delete` |
| 💉 **Dependency Injection** | ✅ **Completo** | `@Injectable`, inyección automática por constructor |
| 📋 **Parameter Injection** | ✅ **Completo** | `@Body`, `@Param`, `@Query`, `@Headers`, `@Db` |
| �️ **ORM Fluido** | ✅ **Completo** | Query builder declarativo para SQL Server |
| 📖 **Documentación API** | ✅ **Completo** | Generación automática con `@ApiOperation` |
| ✅ **Validación** | ✅ **Completo** | DTOs con validación asíncrona |
| �️ **Middleware** | ✅ **Completo** | `@UseMiddleware`, middleware global |
| 🚨 **Error Handling** | ✅ **Completo** | Manejo robusto y logging automático |

## 🚀 **Inicio Rápido**

### 📦 Instalación

```bash
npm install reflect-metadata express @types/express @types/node typescript ts-node
```

### ⚡ Tu Primera API (5 minutos)

```typescript
import 'reflect-metadata';
import { createEZqlApp, Controller, Get, Post, Body, Injectable } from './scr/web';

// DTO con validación
class TaskDto {
  title!: string;
  
  async validate() {
    const errors = [];
    if (!this.title) errors.push({ field: 'title', message: 'Title required' });
    return { isValid: errors.length === 0, errors };
  }
}

// Servicio con Dependency Injection
@Injectable()
class TaskService {
  private tasks = [{ id: 1, title: 'Learn EZql', done: false }];

  getAll() { return { success: true, data: this.tasks }; }
  create(data: TaskDto) {
    const task = { id: Date.now(), ...data, done: false };
    this.tasks.push(task);
    return { success: true, data: task };
  }
}

// Controlador con decoradores
@Controller('/api/tasks')
@Injectable()
class TaskController {
  constructor(private taskService: TaskService) {}

  @Get('/') async getTasks() { return this.taskService.getAll(); }
  
  @Post('/') async createTask(@Body() data: TaskDto) {
    const validation = await Object.assign(new TaskDto(), data).validate();
    if (!validation.isValid) return { success: false, errors: validation.errors };
    return this.taskService.create(data);
  }
}

// Inicializar aplicación
async function main() {
  const app = createEZqlApp({
    port: 3000,
    documentation: { enabled: true, path: '/docs' }
  }).useControllers([TaskController]);

  await app.listen();
  console.log('🚀 http://localhost:3000');
  console.log('📖 http://localhost:3000/docs');
}

main().catch(console.error);
```

**Ejecutar:**
```bash
npx ts-node app.ts
```

**Probar:**
```bash
curl http://localhost:3000/api/tasks
curl -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -d '{"title":"My task"}'
```

## 📚 **Documentación Completa**

| Documento | Descripción | Link |
|-----------|-------------|------|
| 📖 **Guía de Usuario** | Documentación completa con ejemplos | [DOCS.md](./DOCS.md) |
| ⚡ **Inicio Rápido** | API en 5 minutos | [QUICK_START.md](./QUICK_START.md) |
| 📋 **API Reference** | Referencia completa de decoradores y métodos | [API_REFERENCE.md](./API_REFERENCE.md) |
| 🔧 **Arquitectura** | Documentación técnica del ORM | [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) |
| 🎯 **Demo Funcional** | Ejemplo completo funcionando | [decorators-demo.ts](./decorators-demo.ts) |

## 🎨 **Características Principales**

### ✨ Decoradores HTTP (estilo NestJS)
```typescript
@Controller('/api/users')
@Injectable()
class UserController {
  @Get('/')
  @ApiOperation('Get all users')
  async getUsers() { return this.userService.findAll(); }

  @Post('/')
  async createUser(@Body() userData: CreateUserDto) {
    return this.userService.create(userData);
  }

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
```

### 💉 Dependency Injection Automática
```typescript
@Injectable()
class UserService {
  constructor(@Db() private db: EZqlClient) {}

  async findAll() {
    return await this.db.select().from('users').execute();
  }
}
```

### 🗄️ ORM Fluido y Declarativo
```typescript
// SELECT con JOINs y condiciones complejas
const users = await db
  .select(['u.name', 'o.total'])
  .from('users u')
  .leftJoin('orders o', 'u.id = o.user_id')
  .where('u.active', true)
  .whereIn('u.status', ['premium', 'standard'])
  .orderBy('u.name', 'ASC')
  .limit(10)
  .execute();

// INSERT con validación automática
const newUser = await db
  .insert()
  .into('users')
  .values({ name: 'John', email: 'john@example.com' })
  .returning(['id', 'name'])
  .execute();
```

### ✅ Validación Robusta
```typescript
class CreateUserDto {
  name!: string;
  email!: string;

  async validate() {
    const errors = [];
    if (!this.name) errors.push({ field: 'name', message: 'Name required' });
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push({ field: 'email', message: 'Valid email required' });
    }
    return { isValid: errors.length === 0, errors };
  }
}
```

## 🎯 **Casos de Uso**

✅ **APIs REST Modernas**: CRUD completo con validación automática  
✅ **Aplicaciones Empresariales**: Dependency injection y arquitectura escalable  
✅ **Microservicios**: Framework ligero y modular  
✅ **Prototipos Rápidos**: API funcional en minutos  
✅ **Aplicaciones con Base de Datos**: ORM integrado para SQL Server  

## 🧪 **Demo Funcional**

```bash
# Ejecutar demo completo con todos los decoradores
npx ts-node decorators-demo.ts

# Visitar endpoints disponibles:
# http://localhost:3003/demo - Info del framework
# http://localhost:3003/api/items - CRUD completo
# http://localhost:3003/docs - Documentación automática
```

## 🏗️ **Arquitectura**

```
┌─────────────────────────────────────┐
│          HTTP Decorators            │ ← @Controller, @Get, @Post, etc.
├─────────────────────────────────────┤
│       Dependency Injection         │ ← @Injectable, constructor injection
├─────────────────────────────────────┤
│         Parameter Injection        │ ← @Body, @Param, @Query, @Headers
├─────────────────────────────────────┤
│          Validation Layer          │ ← DTOs con validación asíncrona
├─────────────────────────────────────┤
│           Business Logic           │ ← Services y controladores
├─────────────────────────────────────┤
│            ORM Fluido              │ ← Query builders declarativos
├─────────────────────────────────────┤
│           SQL Server               │ ← Base de datos
└─────────────────────────────────────┘
```
