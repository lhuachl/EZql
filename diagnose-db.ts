import sql from 'mssql';

async function diagnoseSqlServer() {
  console.log('🔍 Diagnosticando conexión a SQL Server...\n');

  // Configuraciones a probar
  const configs = [
    {
      name: 'SQL Authentication (actual)',
      config: {
        server: 'localhost',
        database: 'pylonbaytest',
        user: 'ezql_user',
        password: 'EzqlPass123!',
        port: 1433,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true
        }
      }
    },
    {
      name: 'Windows Authentication',
      config: {
        server: 'localhost',
        database: 'master', // Usar master primero
        options: {
          trustedConnection: true,
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true
        }
      }
    },
    {
      name: 'SQL Authentication (master db)',
      config: {
        server: 'localhost',
        database: 'master',
        user: 'sa',
        password: 'YourPassword123!', // Cambiar por tu contraseña SA
        port: 1433,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true
        }
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n📋 Probando: ${name}`);
    console.log(`   Server: ${config.server}:${config.port || 1433}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${(config as any).user || 'Windows Auth'}`);
    
    try {
      const pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log(`✅ ${name}: CONECTADO`);
      
      // Probar una query simple
      const result = await pool.request().query('SELECT @@VERSION as version');
      console.log(`   SQL Server Version: ${result.recordset[0].version.split('\n')[0]}`);
      
      // Listar bases de datos
      const dbResult = await pool.request().query('SELECT name FROM sys.databases WHERE name NOT IN (\'master\', \'tempdb\', \'model\', \'msdb\')');
      console.log(`   Bases de datos disponibles: ${dbResult.recordset.map(r => r.name).join(', ')}`);
      
      await pool.close();
    } catch (error: any) {
      console.log(`❌ ${name}: FALLÓ`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code || 'No code'}`);
    }
  }

  console.log('\n🔧 Pasos de solución:');
  console.log('1. Verificar que SQL Server esté ejecutándose:');
  console.log('   - Abrir "Services" en Windows');
  console.log('   - Buscar "SQL Server (MSSQLSERVER)" o "SQL Server (SQLEXPRESS)"');
  console.log('   - Asegurar que esté "Running"');
  
  console.log('\n2. Verificar configuración de red:');
  console.log('   - Abrir "SQL Server Configuration Manager"');
  console.log('   - Ir a "SQL Server Network Configuration"');
  console.log('   - Habilitar "TCP/IP"');
  console.log('   - Reiniciar SQL Server service');
  
  console.log('\n3. Verificar autenticación:');
  console.log('   - Abrir SQL Server Management Studio (SSMS)');
  console.log('   - Conectar con Windows Authentication');
  console.log('   - Properties > Security > SQL Server and Windows Authentication mode');
  
  console.log('\n4. Crear usuario si no existe:');
  console.log('   - USE master');
  console.log('   - CREATE LOGIN ezql_user WITH PASSWORD = \'EzqlPass123!\'');
  console.log('   - USE pylonbaytest');
  console.log('   - CREATE USER ezql_user FOR LOGIN ezql_user');
  console.log('   - ALTER ROLE db_owner ADD MEMBER ezql_user');
}

diagnoseSqlServer()
  .then(() => console.log('\n✅ Diagnóstico completado'))
  .catch(error => console.error('\n❌ Error en diagnóstico:', error));
