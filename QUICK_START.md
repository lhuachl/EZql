# ⚡ EZql Quick Start

## 🚀 5 Minutos para tu Primera API

### 1. Instalación

```bash
npm init -y
npm install reflect-metadata express @types/express @types/node typescript ts-node
```

### 2. Configuración TypeScript

Crea `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "strict": true
  }
}
```

### 3. Tu Primera API

Crea `app.ts`:

```typescript
import 'reflect-metadata';
import { createEZqlApp, Controller, Get, Post, Body, Injectable } from './scr/web';

// DTO Simple
class TaskDto {
  title!: string;
  
  async validate() {
    const errors = [];
    if (!this.title) errors.push({ field: 'title', message: 'Title required' });
    return { isValid: errors.length === 0, errors };
  }
}

// Servicio
@Injectable()
class TaskService {
  private tasks = [{ id: 1, title: 'Learn EZql', done: false }];

  getAll() {
    return { success: true, data: this.tasks };
  }

  create(data: TaskDto) {
    const task = { id: Date.now(), ...data, done: false };
    this.tasks.push(task);
    return { success: true, data: task };
  }
}

// Controlador
@Controller('/api/tasks')
@Injectable()
class TaskController {
  constructor(private taskService: TaskService) {}

  @Get('/')
  async getTasks() {
    return this.taskService.getAll();
  }

  @Post('/')
  async createTask(@Body() data: TaskDto) {
    const validation = await Object.assign(new TaskDto(), data).validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }
    return this.taskService.create(data);
  }
}

// App
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

### 4. Ejecutar

```bash
npx ts-node app.ts
```

### 5. Probar

```bash
# Obtener tareas
curl http://localhost:3000/api/tasks

# Crear tarea
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My new task"}'

# Ver documentación
open http://localhost:3000/docs
```

## ✅ ¡Listo!

Tienes una API REST completa con:
- ✅ Decoradores HTTP
- ✅ Dependency Injection  
- ✅ Validación automática
- ✅ Documentación API
- ✅ Error handling

## 🎯 Próximos Pasos

1. **Base de Datos**: Agrega SQL Server con `.useEZql(client)`
2. **Middleware**: Autenticación con `@UseMiddleware(auth)`
3. **Validación**: DTOs más complejos
4. **Testing**: Tests con Jest/Supertest

[📚 Ver Documentación Completa](./DOCS.md)
