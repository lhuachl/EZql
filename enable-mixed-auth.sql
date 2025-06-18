-- Script para habilitar autenticación mixta en SQL Server
-- Ejecutar como administrador (sa o cuenta con permisos de sysadmin)

-- 1. Habilitar autenticación mixta (SQL Server + Windows)
USE master;
GO

EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode', 
    REG_DWORD, 
    2;  -- 2 = Mixed Mode (SQL + Windows), 1 = Windows Only
GO

-- 2. Verificar el cambio
SELECT 
    CASE SERVERPROPERTY('IsIntegratedSecurityOnly')
        WHEN 1 THEN 'Windows Authentication Only'
        WHEN 0 THEN 'Mixed Mode (SQL + Windows)'
    END AS [Authentication Mode];
GO

-- 3. Crear el login SQL Server si no existe
IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'ezql_user')
BEGIN
    CREATE LOGIN ezql_user WITH PASSWORD = 'EzqlPass123!';
    PRINT 'Login ezql_user creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Login ezql_user ya existe';
END
GO

-- 4. Crear la base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'pylonbaytest')
BEGIN
    CREATE DATABASE pylonbaytest;
    PRINT 'Base de datos pylonbaytest creada';
END
ELSE
BEGIN
    PRINT 'Base de datos pylonbaytest ya existe';
END
GO

-- 5. Asignar permisos al usuario en la base de datos
USE pylonbaytest;
GO

-- Crear usuario en la base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ezql_user')
BEGIN
    CREATE USER ezql_user FOR LOGIN ezql_user;
    PRINT 'Usuario ezql_user creado en la base de datos';
END
ELSE
BEGIN
    PRINT 'Usuario ezql_user ya existe en la base de datos';
END
GO

-- Asignar rol de db_owner (o los permisos específicos que necesites)
ALTER ROLE db_owner ADD MEMBER ezql_user;
GO

PRINT '✅ Configuración completada. REINICIA EL SERVICIO SQL SERVER para aplicar el modo de autenticación mixta.';
PRINT '⚠️  IMPORTANTE: Debes reiniciar SQL Server Service para que el cambio de autenticación tome efecto.';
