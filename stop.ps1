<#
    Derruba o que o start.ps1 subiu.

        .\stop.ps1            para backend e frontend, mantem o banco
        .\stop.ps1 -Banco     para tudo, inclusive o contêiner do PostgreSQL

    Encerra quem estiver escutando nas portas 3000 e 5173 - identificado pela
    porta, e nao por PID em arquivo, porque cada processo abriu em sua janela.
#>

param([switch]$Banco)

$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

function PararPorta($porta, $nome) {
    $conexoes = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue

    if (-not $conexoes) {
        Write-Host "  $nome (porta $porta): nada escutando"
        return
    }

    # $pid nao serve de variavel de laco: e automatica e somente leitura.
    foreach ($processId in ($conexoes.OwningProcess | Sort-Object -Unique)) {
        try {
            $processo = Get-Process -Id $processId -ErrorAction Stop
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "  $nome (porta $porta): parado - $($processo.ProcessName), PID $processId"
        } catch {
            Write-Host "  $nome (porta $porta): nao foi possivel parar o PID $processId"
        }
    }
}

Write-Host 'Parando os processos Node...'
PararPorta 5173 'frontend'
PararPorta 3000 'backend'

if ($Banco) {
    Write-Host 'Derrubando o contêiner do PostgreSQL...'
    docker compose down
    Write-Host "  os dados continuam no volume; use 'docker compose down -v' para apaga-los"
}

Write-Host 'Pronto.'
