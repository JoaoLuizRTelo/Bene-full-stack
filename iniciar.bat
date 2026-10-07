@echo off
REM ---------------------------------------------------------------------------
REM  Ditado - duplo clique aqui para subir o sistema inteiro.
REM
REM  Este arquivo existe por dois motivos:
REM    1. duplo clique num .ps1 nao executa nada, por politica de execucao;
REM    2. o .bat passa -ExecutionPolicy Bypass apenas para esta execucao,
REM       sem alterar nada na maquina.
REM
REM  Todo o trabalho esta no start.ps1. Aqui so escolhemos o PowerShell certo.
REM ---------------------------------------------------------------------------

title Ditado - iniciando
cd /d "%~dp0"

REM PowerShell 7 quando existir; o 5.1 do Windows como reserva.
set "PS=powershell"
where pwsh >nul 2>nul && set "PS=pwsh"

%PS% -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
set "CODIGO=%ERRORLEVEL%"

if not "%CODIGO%"=="0" (
    echo.
    echo O start.ps1 terminou com erro. A mensagem esta logo acima.
    echo.
    pause
    exit /b %CODIGO%
)

REM Tudo subiu. A janela fecha em instantes; os logs ficam nas janelas filhas.
REM 'ping' e usado como pausa porque 'timeout' exige um console interativo e
REM falha quando este .bat e chamado por outro script.
ping -n 7 127.0.0.1 >nul
exit /b 0
