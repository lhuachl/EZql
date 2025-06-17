# 📖 EZql API Reference

## 🎨 Decoradores HTTP

### @Controller(prefix?: string)
Define un controlador con prefijo de ruta opcional.

```typescript
@Controller('/api/users')
class UserController {
  // Rutas disponibles: /api/users/*
}
```

### Decoradores de Método HTTP

| Decorador | Método HTTP | Ejemplo |
|-----------|-------------|---------|
| `@Get(path?)` | GET | `@Get('/')` → `GET /api/users/` |
| `@Post(path?)` | POST | `@Post('/')` → `POST /api/users/` |
| `@Put(path?)` | PUT | `@Put('/:id')` → `PUT /api/users/:id` |
| `@Delete(path?)` | DELETE | `@Delete('/:id')` → `DELETE /api/users/:id` |
| `@Patch(path?)` | PATCH | `@Patch('/:id')` → `PATCH /api/users/:id` |
| `@Options(path?)` | OPTIONS | `@Options('/')` → `OPTIONS /api/users/` |
| `@Head(path?)` | HEAD | `@Head('/')` → `HEAD /api/users/` |

### Parámetros de Ruta

```typescript
@Controller('/api/users')
class UserController {
  @Get('/')                    // GET /api/users
  @Get('/:id')                 // GET /api/users/123
  @Get('/:id/posts/:postId')   // GET /api/users/123/posts/456
  @Post('/search')             // POST /api/users/search
}
```

## 💉 Parameter Injection

### @Body()
Inyecta el cuerpo completo de la petición.

```typescript
@Post('/')
createUser(@Body() userData: CreateUserDto) {
  return this.userService.create(userData);
}
```

### @Param(key: string)
Inyecta un parámetro específico de la URL.

```typescript
@Get('/:id')
getUser(@Param('id') id: string) {
  return this.userService.findById(id);
}

@Get('/:userId/posts/:postId')
getPost(
  @Param('userId') userId: string,
  @Param('postId') postId: string
) {
  return this.postService.findByIds(userId, postId);
}
```

### @Query(key?: string)
Inyecta parámetros de query string.

```typescript
@Get('/')
getUsers(
  @Query('page') page: string,      // ?page=1
  @Query('limit') limit: string,    // ?limit=10
  @Query() allQuery: any            // Todo el query object
) {
  return this.userService.findAll({ page, limit });
}
```

### @Headers(key?: string)
Inyecta headers HTTP.

```typescript
@Get('/')
getUsers(
  @Headers('authorization') auth: string,  // Authorization header
  @Headers('user-agent') userAgent: string, // User-Agent header
  @Headers() allHeaders: any               // Todos los headers
) {
  // Verificar autenticación, etc.
}
```

### @Req(), @Res(), @Next()
Inyecta objetos nativos de Express.

```typescript
@Get('/download')
downloadFile(
  @Req() req: Request,
  @Res() res: Response,
  @Next() next: NextFunction
) {
  res.download('/path/to/file.pdf');
}
```

### @Db()
Inyecta el cliente de base de datos EZql.

```typescript
@Injectable()
class UserService {
  constructor(@Db() private db: EZqlClient) {}

  async findAll() {
    return await this.db.select().from('users').execute();
  }
}
```

### @Context()
Inyecta el contexto completo de la petición.

```typescript
@Get('/')
getUsers(@Context() ctx: EZqlContext) {
  const { req, res, db, container } = ctx;
  // Acceso completo al contexto
}
```

## 🏭 Dependency Injection

### @Injectable()
Marca una clase como inyectable.

```typescript
@Injectable()
class UserService {
  async findAll() {
    return [];
  }
}

@Injectable()
class EmailService {
  async sendEmail(to: string, subject: string) {
    console.log(`Email to ${to}: ${subject}`);
  }
}
```

### Constructor Injection
Inyección automática por constructor.

```typescript
@Controller('/api/users')
@Injectable()
class UserController {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
    @Db() private db: EZqlClient
  ) {}

  @Post('/')
  async createUser(@Body() userData: CreateUserDto) {
    const user = await this.userService.create(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    return { success: true, data: user };
  }
}
```

### Service Scopes

```typescript
@Injectable('singleton')    // Una instancia para toda la app (default)
@Injectable('transient')    // Nueva instancia cada vez
@Injectable('request')      // Una instancia por petición HTTP
class MyService {}
```

## 📋 Middleware

### @UseMiddleware()
Aplica middleware a controladores o métodos.

```typescript
// Middleware function
const authMiddleware: MiddlewareFunction = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verificar token...
  next();
};

// Aplicar a controlador completo
@Controller('/api/admin')
@UseMiddleware(authMiddleware)
class AdminController {
  @Get('/users')
  getUsers() {
    return this.userService.findAll();
  }
}

// Aplicar a método específico
@Controller('/api/users')
class UserController {
  @Get('/')
  getAllUsers() {
    return this.userService.findAll();
  }

  @Post('/')
  @UseMiddleware(authMiddleware)
  createUser(@Body() userData: CreateUserDto) {
    return this.userService.create(userData);
  }
}
```

## 📖 Documentación API

### @ApiOperation()
Documenta endpoints para generación automática de docs.

```typescript
@Controller('/api/users')
class UserController {
  @Get('/')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of all users',
    tags: ['Users', 'List']
  })
  getUsers() {
    return this.userService.findAll();
  }

  @Post('/')
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user account with validation',
    tags: ['Users', 'Creation']
  })
  createUser(@Body() userData: CreateUserDto) {
    return this.userService.create(userData);
  }

  // Sintaxis corta
  @Get('/:id')
  @ApiOperation('Get user by ID')
  getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
```

## 🏗️ Configuración de Aplicación

### createEZqlApp(config)
Crea una nueva aplicación EZql.

```typescript
const app = createEZqlApp({
  // Puerto del servidor
  port: 3000,
  
  // Host (opcional, default: '0.0.0.0')
  host: 'localhost',
  
  // CORS configuration
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  
  // Documentación API
  documentation: {
    enabled: true,
    path: '/docs',
    title: 'Mi API',
    version: '1.0.0'
  },
  
  // Validación
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  },
  
  // Error handling
  errorHandling: {
    includeStackTrace: process.env.NODE_ENV === 'development',
    logErrors: true
  },
  
  // Middleware global
  middleware: [
    loggingMiddleware,
    compressionMiddleware
  ]
});
```

### Métodos de Aplicación

```typescript
const app = createEZqlApp(config)
  .useEZql(ezqlClient)                    // Configurar base de datos
  .useControllers([UserController])       // Registrar controladores
  .useMiddleware(globalMiddleware)         // Middleware global
  .useErrorHandler(customErrorHandler);   // Error handler custom

// Iniciar servidor
await app.listen();

// Obtener instancia Express (para testing)
const expressApp = app.getExpressApp();

// Obtener router EZql
const router = app.getRouter();

// Cerrar servidor
await app.close();
```

## 🗄️ ORM - Query Builder

### Conexión a Base de Datos

```typescript
import { EZqlClient } from 'ezql';

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

// Usar en aplicación
const app = createEZqlApp().useEZql(ezqlClient);
```

### SELECT Queries

```typescript
// SELECT básico
const users = await db
  .select(['id', 'name', 'email'])
  .from('users')
  .execute();

// SELECT con WHERE
const activeUsers = await db
  .select()
  .from('users')
  .where('active', true)
  .where('age', '>', 18)
  .execute();

// SELECT con JOINs
const usersWithOrders = await db
  .select(['u.name', 'o.total'])
  .from('users u')
  .leftJoin('orders o', 'u.id = o.user_id')
  .where('u.active', true)
  .orderBy('u.name', 'ASC')
  .execute();

// SELECT con condiciones complejas
const users = await db
  .select()
  .from('users')
  .where('age', '>=', 18)
  .whereIn('status', ['active', 'pending'])
  .whereBetween('created_at', ['2023-01-01', '2023-12-31'])
  .whereNull('deleted_at')
  .execute();

// Primer resultado
const user = await db
  .select()
  .from('users')
  .where('id', 1)
  .first();
```

### INSERT Queries

```typescript
// INSERT simple
const newUser = await db
  .insert()
  .into('users')
  .values({ name: 'John', email: 'john@example.com' })
  .returning(['id', 'name'])
  .execute();

// INSERT múltiple
const users = await db
  .insert()
  .into('users')
  .multipleRows([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' }
  ])
  .execute();
```

### UPDATE Queries

```typescript
// UPDATE con WHERE (obligatorio)
const updatedUser = await db
  .update()
  .table('users')
  .set({ name: 'Updated Name', active: false })
  .where('id', userId)
  .returning(['id', 'name'])
  .execute();
```

### DELETE Queries

```typescript
// DELETE con WHERE (obligatorio)
const deletedUser = await db
  .delete()
  .from('users')
  .where('id', userId)
  .returning(['id', 'name'])
  .execute();
```

### Raw Queries

```typescript
// Query raw
const result = await db.raw(
  'SELECT * FROM users WHERE created_at > ?',
  [new Date('2023-01-01')]
);

// Query raw con parámetros nombrados
const result = await db.raw(
  'SELECT * FROM users WHERE name = @name AND age > @age',
  { name: 'John', age: 18 }
);
```

## ✅ Validación de DTOs

### Estructura Básica de DTO

```typescript
class CreateUserDto {
  name!: string;
  email!: string;
  age?: number;
  tags?: string[];

  async validate() {
    const errors = [];

    // Validaciones síncronas
    if (!this.name || this.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        code: 'REQUIRED'
      });
    }

    if (this.name && this.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be 100 characters or less',
        code: 'MAX_LENGTH'
      });
    }

    // Validación de email
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push({
        field: 'email',
        message: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    // Validación condicional
    if (this.age !== undefined && (this.age < 0 || this.age > 150)) {
      errors.push({
        field: 'age',
        message: 'Age must be between 0 and 150',
        code: 'INVALID_RANGE'
      });
    }

    // Validación de array
    if (this.tags && this.tags.length > 10) {
      errors.push({
        field: 'tags',
        message: 'Maximum 10 tags allowed',
        code: 'MAX_ITEMS'
      });
    }

    // Validaciones asíncronas (ej: verificar unicidad)
    if (this.email && await this.emailExists(this.email)) {
      errors.push({
        field: 'email',
        message: 'Email already exists',
        code: 'DUPLICATE'
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

  private async emailExists(email: string): Promise<boolean> {
    // Lógica para verificar si el email existe
    return false;
  }
}
```

### Uso en Controladores

```typescript
@Controller('/api/users')
class UserController {
  @Post('/')
  async createUser(@Body() userData: CreateUserDto) {
    // Crear instancia del DTO para validación
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

## 🔄 Factory Functions

### createEZqlApp()
Función principal para crear aplicaciones.

### createEZqlClient()
Función de conveniencia para crear clientes ORM.

```typescript
import { createEZqlClient } from 'ezql';

const db = createEZqlClient({
  server: 'localhost',
  database: 'myapp',
  user: 'sa',
  password: 'password'
});
```

### createWebApp()
Función para crear aplicaciones web completas.

```typescript
import { createWebApp } from 'ezql';

const app = await createWebApp({
  database: {
    server: 'localhost',
    database: 'myapp',
    user: 'sa',
    password: 'password'
  },
  controllers: [UserController, ProductController],
  config: {
    port: 3000,
    cors: { origin: '*' }
  }
});
```

## 🔍 Tipos TypeScript

### Interfaces Principales

```typescript
// Configuración de aplicación
interface EZqlWebConfig {
  port?: number;
  host?: string;
  cors?: CorsOptions;
  documentation?: DocumentationConfig;
  validation?: ValidationConfig;
  errorHandling?: ErrorHandlingConfig;
  middleware?: MiddlewareFunction[];
}

// Función de middleware
type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Contexto de petición
interface EZqlContext {
  req: Request;
  res: Response;
  db?: EZqlClient;
  container: DIContainer;
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
}

// Respuesta API estándar
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: any;
}
```

---

Esta referencia cubre todas las funcionalidades principales del framework EZql. Para ejemplos más detallados, consulta la [documentación completa](./DOCS.md) y los [ejemplos en vivo](./decorators-demo.ts).
