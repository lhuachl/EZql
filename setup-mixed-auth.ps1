# Script de PowerShell para configurar SQL Server con autenticación mixta
# Ejecutar como Administrador

Write-Host "🔧 Configurando SQL Server para autenticación mixta..." -ForegroundColor Yellow

# 1. Ejecutar el script SQL
$sqlScript = "enable-mixed-auth.sql"
$serverInstance = "localhost"  # Cambia si tu instancia tiene otro nombre

try {
    Write-Host "📋 Ejecutando script SQL..." -ForegroundColor Cyan
    sqlcmd -S $serverInstance -E -i $sqlScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Script SQL ejecutado exitosamente" -ForegroundColor Green
        
        # 2. Reiniciar el servicio SQL Server
        Write-Host "🔄 Reiniciando servicio SQL Server..." -ForegroundColor Cyan
        
        # Buscar el servicio SQL Server (puede tener diferentes nombres)
        $sqlServices = Get-Service | Where-Object { $_.Name -like "*SQL*" -and $_.Name -like "*Server*" }
        
        foreach ($service in $sqlServices) {
            Write-Host "Encontrado servicio: $($service.Name) - Estado: $($service.Status)" -ForegroundColor White
        }
        
        # Intentar reiniciar el servicio principal
        $mainService = Get-Service | Where-Object { $_.Name -eq "MSSQLSERVER" -or $_.Name -like "MSSQL`$*" } | Select-Object -First 1
        
        if ($mainService) {
            Write-Host "🔄 Reiniciando servicio: $($mainService.Name)" -ForegroundColor Yellow
            Restart-Service $mainService.Name -Force
            Start-Sleep 5
            
            $status = Get-Service $mainService.Name
            if ($status.Status -eq "Running") {
                Write-Host "✅ Servicio SQL Server reiniciado exitosamente" -ForegroundColor Green
                Write-Host "🎉 Configuración completada. Ahora puedes probar la conexión con autenticación SQL." -ForegroundColor Green
            } else {
                Write-Host "❌ Error al reiniciar el servicio. Estado actual: $($status.Status)" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️  No se pudo identificar automáticamente el servicio SQL Server principal." -ForegroundColor Yellow
            Write-Host "   Por favor, reinicia manualmente el servicio desde Services.msc" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Error al ejecutar el script SQL" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Asegúrate de:" -ForegroundColor Yellow
    Write-Host "   1. Ejecutar PowerShell como Administrador" -ForegroundColor White
    Write-Host "   2. Tener SQL Server corriendo" -ForegroundColor White
    Write-Host "   3. Tener permisos de Windows Authentication en SQL Server" -ForegroundColor White
}

Write-Host "`n📋 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   - Ver servicios SQL: Get-Service | Where-Object { `$_.Name -like '*SQL*' }" -ForegroundColor White
Write-Host "   - Reiniciar servicio: Restart-Service MSSQLSERVER" -ForegroundColor White
Write-Host "   - Probar conexión: sqlcmd -S localhost -U ezql_user -P EzqlPass123!" -ForegroundColor White
