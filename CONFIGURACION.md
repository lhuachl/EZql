# 🚀 INSTRUCCIONES PARA CONFIGURAR EZql CON SQL SERVER

## 📋 Pre-requisitos

1. **SQL Server instalado y ejecutándose**
2. **SQL Server Management Studio (SSMS)** o **Azure Data Studio**
3. **Node.js 16+** instalado
4. **Credenciales de SQL Server** (usuario y contraseña)

## 🛠️ Pasos de Configuración

### 1. Configurar Base de Datos

**Ejecutar el script SQL:**
```bash
# Abrir SQL Server Management Studio
# Conectar a tu instancia de SQL Server
# Abrir el archivo setup-database.sql
# Ejecutar el script completo (F5)
```

El script creará:
- ✅ Base de datos `pylonbaytest`
- ✅ Tabla `Tasks` con la estructura correcta
- ✅ Trigger para `UpdatedAt`
- ✅ 8 registros de ejemplo

### 2. Configurar Credenciales

**Editar archivo `test.ts` líneas 680-690:**
```typescript
const config: ConnectionConfig = {
  server: 'localhost',          // ⚠️ Tu servidor SQL Server
  database: 'pylonbaytest',     // ✅ Base de datos (ya configurada)
  username: 'sa',               // ⚠️ Tu usuario SQL Server
  password: 'YourPassword123',  // ⚠️ CAMBIAR por tu contraseña real
  port: 1433,                   // ⚠️ Puerto SQL Server (1433 por defecto)
  encrypt: false,               // ⚠️ true si usas SSL/TLS
  trustServerCertificate: true,
  requestTimeout: 30000,
  connectTimeout: 15000
};
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Ejecutar la API
```bash
npm run api
```

## 🧪 Verificar Funcionamiento

Si todo está bien configurado, verás:
```
🚀 === EZql API con SQL Server Real (pylonbaytest) ===

📋 1. Conectando a SQL Server...
🔗 Intentando conectar con configuración:
   Server: localhost:1433
   Database: pylonbaytest
   User: sa
✅ Conectado exitosamente a SQL Server
🔍 Verificando tabla Tasks...
✅ Tabla Tasks encontrada con X registros
📋 Datos de ejemplo en la tabla:
   - ID 1: Configurar proyecto EZql (high)
   - ID 2: Implementar API REST (medium)
   - ID 3: Agregar validaciones (high)

...

🎉 === SERVIDOR HTTP LEVANTADO EXITOSAMENTE ===
🌐 La API está corriendo en: http://localhost:3000
```

## 🌐 Endpoints Disponibles

### API Tasks (SQL Server Real)
- `GET    /api/tasks` - Lista todas las tareas
- `GET    /api/tasks/1` - Obtiene tarea específica
- `POST   /api/tasks` - Crea nueva tarea
- `PUT    /api/tasks/2` - Actualiza tarea
- `DELETE /api/tasks/3` - Elimina tarea
- `GET    /api/tasks/stats/summary` - Estadísticas
- `GET    /api/tasks/search/framework` - Búsqueda

### Health Checks
- `GET    /health` - Estado del sistema
- `GET    /health/database` - Estado de la BD

### Documentación
- `GET    /docs` - JSON de documentación
- `GET    /docs/ui` - Interfaz Swagger

## 🧪 Ejemplos de Prueba

### PowerShell (Windows)
```powershell
# Obtener todas las tareas
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks" -Method GET

# Crear nueva tarea
$body = @{
    Title = "Nueva tarea desde PowerShell"
    Description = "Tarea creada usando PowerShell"
    Priority = "high"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks" -Method POST -Body $body -ContentType "application/json"

# Actualizar tarea
$updateBody = @{
    IsCompleted = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/1" -Method PUT -Body $updateBody -ContentType "application/json"
```

### cURL
```bash
# Obtener todas las tareas
curl http://localhost:3000/api/tasks

# Crear nueva tarea
curl -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"Title": "Nueva tarea", "Description": "Tarea de prueba", "Priority": "high"}'

# Actualizar tarea
curl -X PUT http://localhost:3000/api/tasks/2 \
     -H "Content-Type: application/json" \
     -d '{"IsCompleted": true}'
```

## ❌ Solución de Problemas

### Error de Conexión
```
❌ Error: Failed to connect to SQL Server
```
**Solución:**
1. Verificar que SQL Server esté ejecutándose
2. Verificar credenciales en `test.ts`
3. Verificar que el puerto 1433 esté abierto
4. Verificar configuración de `encrypt` y `trustServerCertificate`

### Error "Login failed"
```
❌ Error: Login failed for user 'sa'
```
**Solución:**
1. Verificar usuario y contraseña
2. Verificar que SQL Server Authentication esté habilitado
3. Verificar que el usuario tenga permisos en la base de datos

### Error "Database not found"
```
❌ Error: Cannot open database "pylonbaytest"
```
**Solución:**
1. Ejecutar el script `setup-database.sql`
2. Verificar que la base de datos se creó correctamente

### Error de Puerto
```
❌ Error: ECONNREFUSED localhost:1433
```
**Solución:**
1. Verificar que SQL Server esté ejecutándose
2. Verificar configuración de puerto en SQL Server Configuration Manager
3. Verificar firewall de Windows

## 📚 Estructura de la Tabla Tasks

```sql
CREATE TABLE Tasks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    Priority NVARCHAR(10) CHECK (Priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    IsCompleted BIT DEFAULT 0,
    DueDate DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
```

## 🎯 DTOs (Objetos de Transferencia)

### CreateTaskDto
```typescript
{
  Title: string;        // Requerido, máx 200 caracteres
  Description: string;  // Opcional, máx 1000 caracteres
  Priority: 'low' | 'medium' | 'high';  // Requerido
  DueDate?: string;     // Opcional, formato ISO
}
```

### UpdateTaskDto
```typescript
{
  Title?: string;
  Description?: string;
  Priority?: 'low' | 'medium' | 'high';
  DueDate?: string;
  IsCompleted?: boolean;
}
```

¡La API EZql ahora está completamente configurada para trabajar con SQL Server real! 🎉
