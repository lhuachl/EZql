-- ===== SCRIPT DE CONFIGURACIÓN PARA PYLONBAYTEST =====
-- Crear base de datos, tabla Tasks y datos de ejemplo
-- Compatible con SQL Server - Ejecutar en SQL Server Management Studio

-- ===== CREAR BASE DE DATOS =====
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'pylonbaytest')
BEGIN
    CREATE DATABASE pylonbaytest;
    PRINT '✅ Base de datos pylonbaytest creada';
END
ELSE
BEGIN
    PRINT '⚠️ Base de datos pylonbaytest ya existe';
END
GO

-- ===== USAR BASE DE DATOS =====
USE pylonbaytest;
GO

-- ===== CREAR TABLA TASKS =====
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' AND xtype='U')
BEGIN
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
    PRINT '✅ Tabla Tasks creada exitosamente';
END
ELSE
BEGIN
    PRINT '⚠️ Tabla Tasks ya existe';
END
GO

-- ===== TRIGGER PARA ACTUALIZAR UpdatedAt =====
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Tasks_UpdatedAt')
BEGIN
    DROP TRIGGER TR_Tasks_UpdatedAt;
    PRINT '⚠️ Trigger TR_Tasks_UpdatedAt eliminado (recreando...)';
END
GO

CREATE TRIGGER TR_Tasks_UpdatedAt
ON Tasks
AFTER UPDATE
AS
BEGIN
    UPDATE Tasks 
    SET UpdatedAt = GETDATE()
    WHERE Id IN (SELECT Id FROM inserted);
END;
GO
PRINT '✅ Trigger TR_Tasks_UpdatedAt creado';

-- ===== INSERTAR DATOS DE EJEMPLO =====
-- Solo insertar si no hay datos
IF (SELECT COUNT(*) FROM Tasks) = 0
BEGIN
    INSERT INTO Tasks (Title, Description, Priority, IsCompleted, DueDate, CreatedAt) VALUES
    ('Configurar proyecto EZql', 'Setup inicial del framework EZql con decoradores HTTP', 'high', 1, '2025-06-15', '2025-06-10'),
    ('Implementar API REST', 'Crear endpoints RESTful con autodocumentación', 'medium', 0, '2025-06-20', '2025-06-12'),
    ('Agregar validaciones', 'Implementar validaciones automáticas con DTOs', 'high', 0, '2025-06-18', '2025-06-14'),
    ('Documentar endpoints', 'Generar documentación Swagger automática', 'low', 1, '2025-06-25', '2025-06-13'),
    ('Conectar SQL Server', 'Integrar base de datos real con el ORM', 'high', 0, '2025-06-17', GETDATE()),
    ('Implementar autenticación', 'Agregar sistema de login y JWT', 'medium', 0, '2025-06-22', GETDATE()),
    ('Optimizar queries', 'Mejorar rendimiento de consultas complejas', 'low', 0, '2025-06-30', GETDATE()),
    ('Deploy a producción', 'Configurar CI/CD y deployment', 'high', 0, '2025-07-01', GETDATE());

    PRINT '✅ Datos de ejemplo insertados';
END
ELSE
BEGIN
    PRINT '⚠️ La tabla ya contiene datos, omitiendo inserción';
END
GO

-- ===== CONSULTAS DE VERIFICACIÓN =====
PRINT '📊 === VERIFICACIÓN DE DATOS ===';

-- Mostrar todas las tareas
SELECT * FROM Tasks ORDER BY Id;

-- Estadísticas básicas
SELECT 
    COUNT(*) as TotalTasks,
    SUM(CASE WHEN IsCompleted = 1 THEN 1 ELSE 0 END) as CompletedTasks,
    SUM(CASE WHEN IsCompleted = 0 THEN 1 ELSE 0 END) as PendingTasks
FROM Tasks;

-- Distribución por prioridad
SELECT 
    Priority, 
    COUNT(*) as Count,
    SUM(CASE WHEN IsCompleted = 1 THEN 1 ELSE 0 END) as Completed,
    SUM(CASE WHEN IsCompleted = 0 THEN 1 ELSE 0 END) as Pending
FROM Tasks 
GROUP BY Priority 
ORDER BY 
    CASE Priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END;

-- Tareas pendientes ordenadas por fecha límite
SELECT Id, Title, Priority, DueDate 
FROM Tasks 
WHERE IsCompleted = 0 
ORDER BY DueDate ASC;

PRINT '🎉 Script de configuración completado exitosamente';
PRINT '💡 La API EZql ahora puede conectarse a pylonbaytest.Tasks';

PRINT '';
PRINT '✅ Base de datos pylonbaytest configurada correctamente';
PRINT 'Ahora puedes ejecutar: npm run api';
