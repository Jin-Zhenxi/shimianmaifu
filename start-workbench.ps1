param([int]$Port = 3210, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw '请先安装 Node.js 22 或更高版本。' }
$env:MV_WORKBENCH_PORT = "$Port"
Write-Host "MV 工作台 http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host '在初始页面填写 DeepSeek API；无需 Codex 登录。按 Ctrl+C 退出后台。'
if (-not $NoBrowser) { $env:MV_WORKBENCH_OPEN = '1' } else { Remove-Item Env:MV_WORKBENCH_OPEN -ErrorAction SilentlyContinue }
& node (Join-Path $PSScriptRoot 'workbench/server.mjs')
