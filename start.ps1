<#
    Sobe o Ditado inteiro: banco, backend e frontend.

        .\start.ps1

    Backend e frontend abrem cada um em sua propria janela do PowerShell, para
    que voce veja os logs ao vivo - que e onde se procura o erro quando algo
    nao sobe. Para derrubar tudo: .\stop.ps1

    Equivalente ao start.sh, que e Bash e nao roda aqui.
#>

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
Set-Location $raiz

function Falhar($mensagem) {
    Write-Host "ERRO: $mensagem" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------ 1. Banco --

Write-Host '[1/3] Subindo o PostgreSQL...'
docker compose up -d
if ($LASTEXITCODE -ne 0) { Falhar 'o Docker nao respondeu. O Docker Desktop esta aberto?' }

Write-Host '      aguardando o banco aceitar conexoes' -NoNewline
$pronto = $false
foreach ($tentativa in 1..30) {
    docker compose exec -T db pg_isready -U ditado -d ditado *> $null
    if ($LASTEXITCODE -eq 0) { $pronto = $true; break }
    Write-Host '.' -NoNewline
    Start-Sleep -Seconds 1
}
if ($pronto) { Write-Host ' ok' } else { Write-Host ''; Falhar 'o banco nao respondeu em 30s. Veja: docker compose logs db' }

# ---------------------------------------------------------------- 2. Backend --

if (-not (Test-Path 'backend\.env')) {
    Falhar 'backend\.env nao existe. Copie backend\.env.example e preencha o JWT_SECRET.'
}
if (-not (Test-Path 'backend\node_modules')) {
    Falhar 'faltam as dependencias do backend. Rode: cd backend; npm install'
}

Write-Host '[2/3] Subindo o backend na porta 3000...'
Start-Process pwsh -ArgumentList '-NoExit', '-Command', "Set-Location '$raiz\backend'; npm run start:dev"

Write-Host '      aguardando /api/health' -NoNewline
$noAr = $false
foreach ($tentativa in 1..45) {
    try {
        Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 2 | Out-Null
        $noAr = $true
        break
    } catch {
        Write-Host '.' -NoNewline
        Start-Sleep -Seconds 1
    }
}
if ($noAr) { Write-Host ' ok' } else { Write-Host ''; Write-Host 'AVISO: a API ainda nao respondeu. Veja a janela do backend.' -ForegroundColor Yellow }

# --------------------------------------------------------------- 3. Frontend --

if (-not (Test-Path 'frontend\node_modules')) {
    Falhar 'faltam as dependencias do frontend. Rode: cd frontend; npm install'
}

Write-Host '[3/3] Subindo o frontend na porta 5173...'
Start-Process pwsh -ArgumentList '-NoExit', '-Command', "Set-Location '$raiz\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host ''
Write-Host '  Ditado no ar:  http://localhost:5173' -ForegroundColor Green
Write-Host '  API:           http://localhost:3000/api/health'
Write-Host ''
Write-Host '  Os logs estao nas duas janelas que abriram.'
Write-Host '  Para parar:    .\stop.ps1'
