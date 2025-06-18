-- Script completo para configurar EZql con SQL Server
-- Ejecutar como administrador (sa o sysadmin)

USE master;
GO

-- 1. Eliminar login anterior si existe (para limpiar)
IF EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'ezql_user')
BEGIN
    DROP LOGIN ezql_user;
    PRINT '🗑️  Login anterior eliminado';
END

-- 2. Crear login SQL Server
CREATE LOGIN ezql_user WITH PASSWORD = 'EzqlPass123!';
PRINT '✅ Login ezql_user creado';

-- 3. Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'pylonbaytest')
BEGIN
    CREATE DATABASE pylonbaytest;
    PRINT '✅ Base de datos pylonbaytest creada';
END

-- 4. Cambiar a la base de datos
USE pylonbaytest;
GO

-- 5. Crear usuario en la base de datos
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ezql_user')
BEGIN
    DROP USER ezql_user;
    PRINT '🗑️  Usuario anterior eliminado de la base de datos';
END

CREATE USER ezql_user FOR LOGIN ezql_user;
PRINT '✅ Usuario creado en la base de datos';

-- 6. Asignar permisos
ALTER ROLE db_owner ADD MEMBER ezql_user;
PRINT '✅ Permisos asignados';

-- 7. Crear tabla de prueba
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tasks')
BEGIN
    DROP TABLE Tasks;
    PRINT '🗑️  Tabla anterior eliminada';
END

CREATE TABLE Tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    completed BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Insertar datos de ejemplo
INSERT INTO Tasks (title, description, completed) VALUES
('Configurar EZql', 'Establecer conexión con SQL Server', 1),
('Implementar API REST', 'Crear endpoints para CRUD de tareas', 0),
('Probar Query Builder', 'Validar que el query builder funciona correctamente', 0),
('Documentar API', 'Crear documentación de endpoints', 0);

PRINT '✅ Tabla Tasks creada con datos de ejemplo';
PRINT '';
PRINT '🎉 Configuración completada exitosamente:';
PRINT '   - Usuario: ezql_user';
PRINT '   - Password: EzqlPass123!';
PRINT '   - Base de datos: pylonbaytest';
PRINT '   - Puerto: 1433';
PRINT '   - Tabla: Tasks (con 4 registros de ejemplo)';
PRINT '';
PRINT '🚀 Ahora puedes ejecutar: npm run api';
