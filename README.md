# EZql ORM - Enterprise SQL Query Builder

Una biblioteca ORM moderna para TypeScript/JavaScript que implementa principios SOLID y mejores prácticas de desarrollo empresarial.

## 🏗️ Arquitectura Mejorada

### Principios SOLID Implementados

#### ✅ Single Responsibility Principle (SRP)
- Cada clase tiene una responsabilidad específica
- Query builders separados por tipo de operación
- Interfaces segregadas por funcionalidad

#### ✅ Open/Closed Principle (OCP)
- Extensible mediante interfaces sin modificar código existente
- Sistema de eventos para funcionalidades adicionales
- Proveedores de conexión intercambiables

#### ✅ Liskov Substitution Principle (LSP)
- Implementaciones intercambiables a través de interfaces
- Contratos bien definidos en todas las abstracciones

#### ✅ Interface Segregation Principle (ISP)
- Interfaces pequeñas y específicas
- Clientes no dependen de métodos que no usan
- Composición de interfaces para funcionalidades complejas

#### ✅ Dependency Inversion Principle (DIP)
- Inyección de dependencias en constructores
- Abstracciones para proveedores de conexión y ejecutores
- Factory patterns para creación de objetos

## 🚀 Características Principales

### 🔧 API Fluida Mejorada
```typescript
import { EZqlClient } from 'ezql-orm';

const client = EZqlClient.create(connectionConfig);

// SELECT con API fluida
const users = await client.select(['id', 'name', 'email'])
  .from('users')
  .where('active', true)
  .whereIn('role', ['admin', 'user'])
  .whereBetween('created_at', '2023-01-01', '2024-12-31')
  .whereNotNull('email')
  .orderBy('name', 'ASC')
  .limit(50)
  .execute();
```

### 🔄 Transacciones Robustas
```typescript
await client.transaction(async (tx) => {
  const order = await tx.insert()
    .into('orders')
    .values({ user_id: 1, total: 299.99 })
    .execute();

  await tx.update()
    .table('products')
    .set('stock', 'stock - 1')
    .where('id', productId)
    .execute();
});
```

### 📡 Sistema de Eventos
```typescript
client.on('query.start', (event) => {
  console.log('Query iniciado:', event.data.sql);
});

client.on('query.complete', (event) => {
  console.log(`Completado en ${event.data.executionTime}ms`);
});

client.on('query.error', (event) => {
  console.error('Error:', event.data.error);
});
```

### 🛡️ Validación y Seguridad
```typescript
// Validación automática de SQL injection
const safeQuery = client.select('*')
  .from('users')
  .whereRaw('name LIKE ?', '%john%')  // Parámetros seguros
  .where('age', '>', 18);            // Tipado fuerte

// Validación de esquemas
const result = await query.execute<User[]>();
```

### ⚡ Optimización de Rendimiento
```typescript
// Consultas optimizadas con SOLID
const optimizedQuery = client.select([
    'u.id',
    'u.name',
    'COUNT(o.id) as order_count'
  ])
  .from('users u')
  .leftJoin('orders o', 'u.id = o.user_id')
  .where('u.active', true)
  .groupBy('u.id', 'u.name')
  .having('COUNT(o.id) > 5')
  .orderBy('order_count', 'DESC');
```

## 🏗️ Estructura del Proyecto

```
scr/
├── core/                          # Núcleo del ORM
│   ├── EZqlClient.ts             # Cliente principal con DI
│   ├── abstractions/             # Interfaces (DIP)
│   │   └── index.ts             # Abstracciones mejoradas
│   ├── connection/              # Proveedores de conexión
│   │   ├── config.ts           
│   │   └── SqlServerConnectionProvider.ts
│   ├── execution/              # Ejecutores de queries
│   │   └── SqlServerQueryExecutor.ts
│   └── query/                  # Query builders core
│       ├── SelectQueryBuilder.ts
│       ├── InsertQueryBuilder.ts
│       ├── UpdateQueryBuilder.ts
│       └── DeleteQueryBuilder.ts
├── builders/                   # Fluent query builders
│   ├── FluentSelectQuery.ts
│   ├── FluentInsertQuery.ts
│   ├── FluentUpdateQuery.ts
│   └── FluentDeleteQuery.ts
└── types/                     # Tipos TypeScript
    ├── core.ts               # Tipos centralizados
    └── fluent-interfaces.ts  # Interfaces fluidas
```

## 🔧 Instalación y Configuración

### Instalación
```bash
npm install ezql-orm
# o
yarn add ezql-orm
```

### Configuración Básica
```typescript
import { EZqlClient, ConnectionConfig } from 'ezql-orm';

const config: ConnectionConfig = {
  server: 'localhost',
  database: 'mi_base_datos',
  user: 'usuario',
  password: 'contraseña',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const client = EZqlClient.create(config, {
  logQueries: true,
  timeout: 30000
});

await client.connect();
```

## 📚 Ejemplos de Uso

### CRUD Básico
```typescript
// CREATE
const newUser = await client.insert()
  .into('users')
  .values({
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    active: true
  })
  .returning(['id'])
  .execute();

// READ
const activeUsers = await client.select(['id', 'name', 'email'])
  .from('users')
  .where('active', true)
  .orderBy('name')
  .execute();

// UPDATE
await client.update()
  .table('users')
  .set({ last_login: new Date() })
  .where('id', userId)
  .execute();

// DELETE
await client.delete()
  .from('users')
  .where('active', false)
  .where('last_login', '<', oldDate)
  .execute();
```

### Consultas Avanzadas
```typescript
// JOIN múltiples con agregaciones
const report = await client.select([
    'u.name',
    'COUNT(o.id) as total_orders',
    'SUM(o.total) as total_spent',
    'AVG(o.total) as avg_order_value'
  ])
  .from('users u')
  .leftJoin('orders o', 'u.id = o.user_id')
  .leftJoin('order_items oi', 'o.id = oi.order_id')
  .where('u.active', true)
  .whereBetween('o.created_at', startDate, endDate)
  .groupBy('u.id', 'u.name')
  .having('COUNT(o.id) > 0')
  .orderBy('total_spent', 'DESC')
  .limit(100)
  .execute();

// Subconsultas
const topCustomers = await client.select('*')
  .from('users')
  .whereRaw(`
    total_spent > (
      SELECT AVG(total_spent) * 2 
      FROM users 
      WHERE active = ?
    )
  `, true)
  .execute();
```

### Transacciones Complejas
```typescript
await client.transaction(async (tx) => {
  // Crear pedido
  const order = await tx.insert()
    .into('orders')
    .values({ user_id: 1, total: 299.99 })
    .returning(['id'])
    .execute();

  // Agregar items
  await tx.insert()
    .into('order_items')
    .multipleRows([
      { order_id: order[0].id, product_id: 1, quantity: 2 },
      { order_id: order[0].id, product_id: 2, quantity: 1 }
    ])
    .execute();

  // Actualizar stock
  await tx.update()
    .table('products')
    .set('stock', 'stock - 2')
    .where('id', 1)
    .whereRaw('stock >= ?', 2)
    .execute();
});
```

## 🎯 Mejores Prácticas

### 1. Uso de Tipos TypeScript
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

const users = await client.select<User>(['id', 'name', 'email', 'active'])
  .from('users')
  .execute();
```

### 2. Manejo de Errores
```typescript
try {
  const result = await client.select('*')
    .from('users')
    .execute();
} catch (error) {
  if (error instanceof EZqlError) {
    console.error('Error EZql:', error.message);
  }
}
```

### 3. Configuración de Eventos
```typescript
// Logging automático
client.on('query.complete', (event) => {
  logger.info(`Query ejecutado en ${event.data.executionTime}ms`);
});

// Monitoreo de rendimiento
client.on('query.start', (event) => {
  if (event.data.sql.includes('SELECT')) {
    metrics.increment('queries.select');
  }
});
```

### 4. Validación de Datos
```typescript
function validateUser(data: any): data is User {
  return data.name && 
         data.email && 
         typeof data.active === 'boolean';
}

if (validateUser(userData)) {
  await client.insert()
    .into('users')
    .values(userData)
    .execute();
}
```

## 🔍 Testing

### Pruebas Unitarias
```typescript
import { testQueries } from './test-queries';

// Ejecutar todas las pruebas
await testQueries();
```

### Pruebas de Integración
```typescript
import { ejemploCrudBasico, ejemploTransacciones } from './ejemplos-avanzados';

await ejemploCrudBasico();
await ejemploTransacciones();
```

## 📊 Métricas y Monitoreo

```typescript
// Obtener estadísticas del cliente
const stats = client.getClientStats();
console.log('Conexiones activas:', stats.isConnected);
console.log('Listeners de eventos:', stats.eventListenerCount);

// Health check
const health = await client.healthCheck();
console.log('Estado del servidor:', health);
```

## 🤝 Contribuciones

### Principios de Contribución
1. **SOLID**: Todas las contribuciones deben seguir principios SOLID
2. **Testing**: Incluir pruebas unitarias y de integración
3. **TypeScript**: Tipado fuerte obligatorio
4. **Documentación**: JSDoc en todas las funciones públicas

### Estructura de Commits
```
feat(core): implementar nuevo patrón Factory para builders
fix(query): corregir validación de parámetros WHERE
docs(readme): actualizar ejemplos de transacciones
test(builders): agregar pruebas para FluentSelectQuery
```

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 🔗 Enlaces

- [Documentación Completa](./docs)
- [Ejemplos Avanzados](./ejemplos-avanzados.ts)
- [Pruebas](./test-queries.ts)
- [Changelog](./CHANGELOG.md)

---

## 🎯 Roadmap

### v2.0 (Próxima versión)
- [ ] Soporte para múltiples bases de datos (PostgreSQL, MySQL)
- [ ] Cache inteligente de queries
- [ ] Migraciones automáticas
- [ ] GraphQL integration
- [ ] CLI para generación de código

### v2.1
- [ ] Réplicas de lectura automáticas
- [ ] Connection pooling avanzado
- [ ] Métricas de rendimiento integradas
- [ ] Audit logging automático

---

**EZql ORM** - Construido con ❤️ siguiendo principios SOLID y mejores prácticas de desarrollo empresarial.
