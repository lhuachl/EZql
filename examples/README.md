# 🎯 Ejemplos de EZql Framework

Esta carpeta contiene ejemplos prácticos del framework EZql para diferentes casos de uso.

## 📂 Ejemplos Disponibles

### 1. **basic-api.ts** - API Básica
- Controladores simples sin base de datos
- Decoradores HTTP básicos
- Validación de DTOs
- Documentación API

### 2. **crud-with-database.ts** - CRUD Completo
- Conexión a SQL Server
- Operaciones CRUD completas
- Relaciones entre tablas
- Validación avanzada

### 3. **authentication.ts** - Autenticación
- Sistema de login/registro
- Middleware de autenticación
- JWT tokens
- Roles y permisos

### 4. **file-upload.ts** - Subida de Archivos
- Upload de archivos
- Validación de tipos
- Almacenamiento local/cloud
- Middleware personalizado

### 5. **advanced-queries.ts** - Queries Avanzadas
- JOINs complejos
- Agregaciones
- Subqueries
- Raw SQL cuando es necesario

## 🚀 Cómo Ejecutar

```bash
# Ejemplo básico
npx ts-node examples/basic-api.ts

# CRUD con base de datos
npx ts-node examples/crud-with-database.ts

# Autenticación
npx ts-node examples/authentication.ts
```

## 📚 Ver También

- [Documentación Principal](../DOCS.md)
- [Inicio Rápido](../QUICK_START.md)
- [API Reference](../API_REFERENCE.md)
- [Demo Completo](../decorators-demo.ts)
