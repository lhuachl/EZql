# 📚 EZql Framework - Guía de Usuario

## 🚀 Introducción

EZql es un framework web moderno para TypeScript que combina un ORM potente con un sistema de decoradores similar a NestJS/Spring Boot. Permite crear APIs REST de forma declarativa con dependency injection automática.

## 🎯 Características Principales

✅ **Decoradores HTTP**: `@Controller`, `@Get`, `@Post`, `@Put`, `@Delete`  
✅ **Dependency Injection**: `@Injectable` con inyección automática  
✅ **Parameter Injection**: `@Body`, `@Param`, `@Query`, `@Headers`  
✅ **Validación Automática**: DTOs con validación integrada  
✅ **ORM Fluido**: Query builder declarativo para SQL Server  
✅ **Documentación API**: Generación automática de documentación  
✅ **Middleware**: Sistema de middleware flexible  
✅ **Error Handling**: Manejo robusto de errores  

## 📦 Instalación

```bash
npm install ezql reflect-metadata express
```

### Dependencias Requeridas

```bash
npm install @types/express @types/node typescript ts-node
```

## ⚙️ Configuración Inicial

### 1. TypeScript Configuration

Crea o actualiza tu `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### 2. Importar Reflect Metadata

**⚠️ IMPORTANTE**: Siempre importa `reflect-metadata` al inicio de tu aplicación:

```typescript
import 'reflect-metadata';
import { createEZqlApp, Controller, Get, Injectable } from 'ezql';
```

## 🏁 Inicio Rápido

### Ejemplo Básico - API Sin Base de Datos

```typescript
import 'reflect-metadata';
import { createEZqlApp, Controller, Get, Post, Body, Injectable } from 'ezql';

// DTO para validación
class CreateItemDto {
  name!: string;
  value!: string;

  async validate() {
    const errors = [];
    if (!this.name) errors.push({ field: 'name', message: 'Name is required' });
    if (!this.value) errors.push({ field: 'value', message: 'Value is required' });
    return { isValid: errors.length === 0, errors };
  }
}

// Servicio con Dependency Injection
@Injectable()
class ItemService {
  private items = [
    { id: 1, name: 'Item 1', value: 'Value 1' }
  ];

  getAll() {
    return { success: true, data: this.items };
  }

  async create(data: CreateItemDto) {
    const validation = await data.validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }
    
    const item = { id: Date.now(), ...data };
    this.items.push(item);
    return { success: true, data: item };
  }
}

// Controlador con decoradores
@Controller('/api/items')
@Injectable()
class ItemController {
  constructor(private itemService: ItemService) {}

  @Get('/')
  async getAll() {
    return this.itemService.getAll();
  }

  @Post('/')
  async create(@Body() data: CreateItemDto) {
    return this.itemService.create(data);
  }
}

// Inicializar aplicación
async function main() {
  const app = createEZqlApp({
    port: 3000,
    cors: { origin: '*' }
  }).useControllers([ItemController]);

  await app.listen();
  console.log('🚀 Server running on http://localhost:3000');
}

main().catch(console.error);
```

## 🎨 Decoradores HTTP

### Decoradores de Ruta

```typescript
@Controller('/api/users')  // Prefijo de ruta
class UserController {
  @Get('/')              // GET /api/users
  @Get('/:id')           // GET /api/users/:id
  @Post('/')             // POST /api/users
  @Put('/:id')           // PUT /api/users/:id
  @Delete('/:id')        // DELETE /api/users/:id
  @Patch('/:id')         // PATCH /api/users/:id
}
```

### Parameter Injection

```typescript
@Controller('/api/users')
class UserController {
  @Get('/:id')
  getUser(
    @Param('id') id: string,           // Parámetro de URL
    @Query('include') include: string,  // Query parameter
    @Headers('authorization') auth: string  // Header
  ) {
    return { id, include, auth };
  }

  @Post('/')
  createUser(@Body() userData: CreateUserDto) {  // Request body
    return this.userService.create(userData);
  }
}
```

## 💉 Dependency Injection

### Servicios Inyectables

```typescript
@Injectable()
class UserService {
  private users = [];

  async findAll() {
    return this.users;
  }

  async create(userData: any) {
    const user = { id: Date.now(), ...userData };
    this.users.push(user);
    return user;
  }
}

@Injectable()
class EmailService {
  async sendWelcomeEmail(email: string) {
    console.log(`Sending welcome email to ${email}`);
  }
}
```

### Inyección en Controladores

```typescript
@Controller('/api/users')
@Injectable()
class UserController {
  constructor(
    private userService: UserService,
    private emailService: EmailService
  ) {}

  @Post('/')
  async createUser(@Body() userData: CreateUserDto) {
    const user = await this.userService.create(userData);
    await this.emailService.sendWelcomeEmail(userData.email);
    return { success: true, data: user };
  }
}
```

## 🗄️ ORM y Base de Datos

### Configuración de Base de Datos

```typescript
import { createEZqlApp, EZqlClient } from 'ezql';

// Configurar cliente de base de datos
const ezqlClient = EZqlClient.create({
  server: 'localhost',
  database: 'myapp',
  user: 'sa',
  password: 'password',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
});

// Crear aplicación con base de datos
const app = createEZqlApp({
  port: 3000
})
.useEZql(ezqlClient)
.useControllers([UserController]);
```

### Usar ORM en Servicios

```typescript
@Injectable()
class UserService {
  constructor(@Db() private db: EZqlClient) {}

  async findAll() {
    return await this.db
      .select(['id', 'name', 'email'])
      .from('users')
      .where('active', true)
      .execute();
  }

  async findById(id: number) {
    return await this.db
      .select()
      .from('users')
      .where('id', id)
      .first();
  }

  async create(userData: any) {
    return await this.db
      .insert()
      .into('users')
      .values(userData)
      .returning(['id', 'name', 'email'])
      .execute();
  }
}
```

## ✅ Validación de DTOs

### DTO Básico

```typescript
class CreateUserDto {
  name!: string;
  email!: string;
  age?: number;

  async validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        code: 'REQUIRED'
      });
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push({
        field: 'email',
        message: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    if (this.age !== undefined && (this.age < 0 || this.age > 150)) {
      errors.push({
        field: 'age',
        message: 'Age must be between 0 and 150',
        code: 'INVALID_RANGE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### Validación Automática en Controladores

```typescript
@Controller('/api/users')
class UserController {
  @Post('/')
  async createUser(@Body() userData: CreateUserDto) {
    // Validación automática
    const dto = Object.assign(new CreateUserDto(), userData);
    const validation = await dto.validate();
    
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }

    // Procesar datos válidos
    const user = await this.userService.create(dto);
    return { success: true, data: user };
  }
}
```

## 📖 Documentación API

### Configurar Documentación

```typescript
const app = createEZqlApp({
  port: 3000,
  documentation: {
    enabled: true,
    path: '/docs',
    title: 'Mi API',
    version: '1.0.0'
  }
});
```

### Documentar Endpoints

```typescript
@Controller('/api/users')
class UserController {
  @Get('/')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users with pagination',
    tags: ['Users']
  })
  async getUsers() {
    return this.userService.findAll();
  }

  @Post('/')
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user account',
    tags: ['Users', 'Creation']
  })
  async createUser(@Body() userData: CreateUserDto) {
    return this.userService.create(userData);
  }
}
```

## 🔧 Middleware

### Middleware Custom

```typescript
import { MiddlewareFunction } from 'ezql';

const loggingMiddleware: MiddlewareFunction = (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

const authMiddleware: MiddlewareFunction = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  next();
};
```

### Aplicar Middleware

```typescript
// Global
const app = createEZqlApp({
  port: 3000,
  middleware: [loggingMiddleware]
});

// Por controlador
@Controller('/api/admin')
@UseMiddleware(authMiddleware)
class AdminController {
  @Get('/users')
  async getUsers() {
    return this.userService.findAll();
  }
}
```

## ⚡ Ejemplos Completos

### API REST Completa

```typescript
import 'reflect-metadata';
import { 
  createEZqlApp, Controller, Get, Post, Put, Delete,
  Body, Param, Injectable, ApiOperation 
} from 'ezql';

// DTO
class CreateUserDto {
  name!: string;
  email!: string;
  // ... validación
}

class UpdateUserDto {
  name?: string;
  email?: string;
  // ... validación
}

// Servicio
@Injectable()
class UserService {
  private users = [];

  async findAll() {
    return { success: true, data: this.users };
  }

  async findById(id: string) {
    const user = this.users.find(u => u.id === id);
    return user ? { success: true, data: user } : { success: false, message: 'User not found' };
  }

  async create(userData: CreateUserDto) {
    const user = { id: Date.now().toString(), ...userData, createdAt: new Date() };
    this.users.push(user);
    return { success: true, data: user };
  }

  async update(id: string, userData: UpdateUserDto) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: 'User not found' };
    
    this.users[index] = { ...this.users[index], ...userData, updatedAt: new Date() };
    return { success: true, data: this.users[index] };
  }

  async delete(id: string) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: 'User not found' };
    
    const deleted = this.users.splice(index, 1)[0];
    return { success: true, data: deleted };
  }
}

// Controlador
@Controller('/api/users')
@Injectable()
class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get all users', tags: ['Users'] })
  async getUsers() {
    return this.userService.findAll();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID', tags: ['Users'] })
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post('/')
  @ApiOperation({ summary: 'Create user', tags: ['Users'] })
  async createUser(@Body() userData: CreateUserDto) {
    return this.userService.create(userData);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update user', tags: ['Users'] })
  async updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto) {
    return this.userService.update(id, userData);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete user', tags: ['Users'] })
  async deleteUser(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}

// Aplicación
async function main() {
  const app = createEZqlApp({
    port: 3000,
    cors: { origin: '*' },
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'Users API',
      version: '1.0.0'
    }
  }).useControllers([UserController]);

  await app.listen();
  console.log('🚀 API running on http://localhost:3000');
  console.log('📖 Docs available at http://localhost:3000/docs');
}

main().catch(console.error);
```

## 🚨 Manejo de Errores

### Errores Personalizados

```typescript
class ValidationError extends Error {
  constructor(public errors: any[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

@Injectable()
class UserService {
  async create(userData: CreateUserDto) {
    const validation = await userData.validate();
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    // ... crear usuario
  }
}
```

### Error Handler Global

```typescript
const app = createEZqlApp({
  port: 3000,
  errorHandling: {
    includeStackTrace: process.env.NODE_ENV === 'development',
    logErrors: true
  }
});
```

## 🧪 Testing

### Ejemplo de Test

```typescript
import { createEZqlApp } from 'ezql';
import request from 'supertest';

describe('UserController', () => {
  let app: any;

  beforeAll(async () => {
    app = createEZqlApp({
      port: 3001
    }).useControllers([UserController]);
    
    await app.listen();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a user', async () => {
    const response = await request(app.getExpressApp())
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@example.com' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test User');
  });
});
```

## 📋 Mejores Prácticas

### 1. Estructura de Proyecto

```
src/
├── controllers/
│   ├── user.controller.ts
│   └── auth.controller.ts
├── services/
│   ├── user.service.ts
│   └── email.service.ts
├── dtos/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── logging.middleware.ts
└── app.ts
```

### 2. Validación Robusta

- Siempre valida datos de entrada
- Usa DTOs para tipado fuerte
- Implementa validación asíncrona cuando sea necesario

### 3. Error Handling

- Usa códigos de error consistentes
- Proporciona mensajes de error claros
- Loguea errores para debugging

### 4. Documentación

- Usa `@ApiOperation` en todos los endpoints
- Agrupa endpoints con tags
- Mantén la documentación actualizada

## 🔗 Referencias

- [Documentación del ORM](./REFACTORING_SUMMARY.md)
- [Ejemplos Completos](./decorators-demo.ts)
- [Configuración TypeScript](./tsconfig.json)

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature
3. Implementa tests
4. Envía un Pull Request

---

**¿Necesitas ayuda?** 
- 📧 Email: support@ezql.dev
- 🐛 Issues: [GitHub Issues](https://github.com/lhuachl/EZql/issues)
- 💬 Discord: [EZql Community](https://discord.gg/ezql)
