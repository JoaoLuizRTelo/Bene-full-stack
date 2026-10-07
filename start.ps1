<#
    Sobe o Ditado inteiro: Docker, banco, backend e frontend.

        .\start.ps1                 sobe tudo e abre o navegador
        .\start.ps1 -SemNavegador   sobe tudo e nao abre o navegador

    Quem prefere duplo clique usa o iniciar.bat, que chama este script.

    Backend e frontend abrem cada um em sua propria janela, para que voce veja
    os logs ao vivo - que e onde se procura o erro quando algo nao sobe.
    Para derrubar tudo: .\stop.ps1 (ou parar.bat)

    Equivalente ao start.sh, que e Bash e nao roda aqui.
#>

param([switch]$SemNavegador)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
Set-Location $raiz

function Falhar($mensagem) {
    Write-Host ''
    Write-Host "ERRO: $mensagem" -ForegroundColor Red
    exit 1
}

# O mesmo PowerShell que rodou este script e o que abre as janelas filhas:
# nem toda maquina tem o pwsh (PowerShell 7) instalado.
$shell = if ($PSVersionTable.PSEdition -eq 'Core') { 'pwsh' } else { 'powershell' }

# ------------------------------------------------------------------ 0. Docker --

Write-Host '[1/4] Conferindo o Docker...'
docker info *> $null

if ($LASTEXITCODE -ne 0) {
    $exe = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'

    if (-not (Test-Path $exe)) {
        Falhar "o Docker nao respondeu e nao achei o Docker Desktop em '$exe'. Abra-o a mao e rode de novo."
    }

    Write-Host '      o Docker Desktop esta fechado; abrindo' -NoNewline
    Start-Process $exe

    $noAr = $false
    foreach ($tentativa in 1..60) {
        Start-Sleep -Seconds 2
        docker info *> $null
        if ($LASTEXITCODE -eq 0) { $noAr = $true; break }
        Write-Host '.' -NoNewline
    }

    if ($noAr) {
        Write-Host ' ok'
    } else {
        Falhar 'o Docker Desktop nao ficou pronto em 2 minutos. Abra-o a mao e rode de novo.'
    }
} else {
    Write-Host '      ja esta rodando'
}

# ------------------------------------------------------------------ 1. Banco --

Write-Host '[2/4] Subindo o PostgreSQL...'
docker compose up -d
if ($LASTEXITCODE -ne 0) { Falhar 'o docker compose falhou. Veja a mensagem acima.' }

Write-Host '      aguardando o banco aceitar conexoes' -NoNewline
$pronto = $false
foreach ($tentativa in 1..30) {
    docker compose exec -T db pg_isready -U ditado -d ditado *> $null
    if ($LASTEXITCODE -eq 0) { $pronto = $true; break }
    Write-Host '.' -NoNewline
    Start-Sleep -Seconds 1
}
if ($pronto) { Write-Host ' ok' } else { Falhar 'o banco nao respondeu em 30s. Veja: docker compose logs db' }

# ---------------------------------------------------------------- 2. Backend --

if (-not (Test-Path 'backend\.env')) {
    Falhar 'backend\.env nao existe. Copie backend\.env.example e preencha o JWT_SECRET.'
}
if (-not (Test-Path 'backend\node_modules')) {
    Falhar 'faltam as dependencias do backend. Rode: cd backend; npm install'
}

# Ja ha um backend na porta 3000? Reaproveita em vez de colidir com EADDRINUSE.
$backendNoAr = [bool](Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)

if ($backendNoAr) {
    Write-Host '[3/4] O backend ja esta na porta 3000; mantendo o que esta rodando.'
} else {
    Write-Host '[3/4] Subindo o backend na porta 3000...'
    Start-Process $shell -ArgumentList '-NoExit', '-NoProfile', '-Command', "Set-Location '$raiz\backend'; npm run start:dev"

    Write-Host '      aguardando /api/health' -NoNewline
    $api = $false
    foreach ($tentativa in 1..45) {
        try {
            Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 2 | Out-Null
            $api = $true
            break
        } catch {
            Write-Host '.' -NoNewline
            Start-Sleep -Seconds 1
        }
    }
    if ($api) {
        Write-Host ' ok'
    } else {
        Write-Host ''
        Write-Host 'AVISO: a API ainda nao respondeu. Veja a janela do backend.' -ForegroundColor Yellow
    }
}

# --------------------------------------------------------------- 3. Frontend --

if (-not (Test-Path 'frontend\node_modules')) {
    Falhar 'faltam as dependencias do frontend. Rode: cd frontend; npm install'
}

$frontendNoAr = [bool](Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)

if ($frontendNoAr) {
    Write-Host '[4/4] O frontend ja esta na porta 5173; mantendo o que esta rodando.'
} else {
    Write-Host '[4/4] Subindo o frontend na porta 5173...'
    Start-Process $shell -ArgumentList '-NoExit', '-NoProfile', '-Command', "Set-Location '$raiz\frontend'; npm run dev"
    Start-Sleep -Seconds 4
}

# ------------------------------------------------------------------- Pronto --

Write-Host ''
Write-Host '  Ditado no ar:  http://localhost:5173' -ForegroundColor Green
Write-Host '  API:           http://localhost:3000/api/health'
Write-Host ''
Write-Host '  Os logs estao nas duas janelas que abriram.'
Write-Host '  Para parar:    .\stop.ps1    (ou parar.bat)'

if (-not $SemNavegador) {
    Start-Process 'http://localhost:5173'
}
