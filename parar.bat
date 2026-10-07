@echo off
REM ---------------------------------------------------------------------------
REM  Ditado - duplo clique aqui para derrubar o sistema.
REM
REM  Para o backend (3000) e o frontend (5173). O conteiner do PostgreSQL
REM  continua de pe: ele consome pouco e guarda os dados. Para derrubar o
REM  banco tambem, rode no PowerShell:  .\stop.ps1 -Banco
REM ---------------------------------------------------------------------------

title Ditado - parando
cd /d "%~dp0"

set "PS=powershell"
where pwsh >nul 2>nul && set "PS=pwsh"

%PS% -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"

echo.
pause
