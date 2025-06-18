-- Crear tabla Tasks para el sistema de tareas
USE pylonbaytest;
GO

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

-- Insertar datos de ejemplo
IF NOT EXISTS (SELECT * FROM Tasks)
BEGIN
    INSERT INTO Tasks (Title, Description, Priority, IsCompleted, DueDate) VALUES
    ('Implementar API REST', 'Crear endpoints para CRUD de tareas', 'high', 0, DATEADD(day, 7, GETDATE())),
    ('Escribir documentación', 'Documentar todos los endpoints de la API', 'medium', 0, DATEADD(day, 14, GETDATE())),
    ('Configurar base de datos', 'Configurar SQL Server con autenticación mixta', 'high', 1, NULL),
    ('Crear tests unitarios', 'Escribir tests para todos los controladores', 'medium', 0, DATEADD(day, 10, GETDATE())),
    ('Revisar código', 'Code review de la implementación actual', 'low', 0, DATEADD(day, 3, GETDATE()));
    
    PRINT '✅ Datos de ejemplo insertados en Tasks';
END

-- Mostrar las tareas creadas
SELECT * FROM Tasks;
