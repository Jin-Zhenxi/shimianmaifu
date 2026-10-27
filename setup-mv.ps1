param(
    [switch]$SkillsOnly,
    [switch]$DependenciesOnly
)
$ErrorActionPreference = 'Stop'
if ($SkillsOnly -and $DependenciesOnly) { throw 'Choose only one mode.' }
Set-Location -LiteralPath $PSScriptRoot
$mvPrefix = Join-Path $PSScriptRoot '.conda/mv'
$mvPython = Join-Path $mvPrefix 'python.exe'
$condaCommand = Get-Command conda -ErrorAction SilentlyContinue
if ($condaCommand) { $mvConda = $condaCommand.Source }
else { $mvConda = Join-Path $env:USERPROFILE 'miniconda3/condabin/conda.bat' }
if (-not (Test-Path -LiteralPath $mvConda)) { throw 'Conda not found. Run in Miniconda Prompt / initialized PowerShell.' }

if (-not $SkillsOnly) {
    $env:CONDA_PKGS_DIRS = Join-Path $PSScriptRoot '.cache/conda-pkgs'
    $env:PIP_CACHE_DIR = Join-Path $PSScriptRoot '.cache/pip'
    if (-not (Test-Path -LiteralPath $mvPython)) {
        & $mvConda create --prefix $mvPrefix --override-channels --channel conda-forge python=3.11 pip ffmpeg --yes
    } else {
        & $mvConda install --prefix $mvPrefix --override-channels --channel conda-forge python=3.11 pip ffmpeg --yes
    }
    if ($LASTEXITCODE -ne 0) { throw 'Conda environment installation failed.' }
    & $mvConda run --prefix $mvPrefix python -m pip install -r (Join-Path $PSScriptRoot 'requirements-audio.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    & $mvConda run --prefix $mvPrefix python -c "import whisper,librosa,soundfile,numpy,scipy,matplotlib,PIL,torch; print('Audio imports OK'); print('CUDA available:',torch.cuda.is_available())"
    if ($LASTEXITCODE -ne 0) { throw 'Python import verification failed.' }
    & $mvConda run --prefix $mvPrefix ffmpeg -version
    if ($LASTEXITCODE -ne 0) { throw 'FFmpeg verification failed.' }
    & $mvConda run --prefix $mvPrefix ffprobe -version
    if ($LASTEXITCODE -ne 0) { throw 'FFprobe verification failed.' }
    $mvFreeze = & $mvConda run --prefix $mvPrefix python -m pip freeze
    if ($LASTEXITCODE -ne 0) { throw 'Cannot record installed packages.' }
    $mvFreeze | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $PSScriptRoot 'requirements-audio.installed.txt')
}

if (-not $DependenciesOnly) {
    $installer = Join-Path $env:USERPROFILE '.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py'
    if (-not (Test-Path -LiteralPath $installer)) { throw "Skill installer not found: $installer" }
    if (-not (Test-Path -LiteralPath $mvPython)) {
        $mvPython = Join-Path $env:USERPROFILE 'miniconda3/python.exe'
    }
    $skillDest = Join-Path $PSScriptRoot '.agents/skills'
    $skillSpecs = @(
        @{ Repo='Win-Hao/music-mv'; Path='.'; Name='music-mv' },
        @{ Repo='remotion-dev/skills'; Path='skills/remotion-best-practices'; Name='remotion-best-practices' },
        @{ Repo='BuzyOwl/song-video-director'; Path='skill/song-video-director'; Name='song-video-director' },
        @{ Repo='vibegameengine/video-motion-craft'; Path='.'; Name='video-motion-craft' }
    )
    $failedSkills = @()
    foreach ($spec in $skillSpecs) {
        $target = Join-Path $skillDest $spec.Name
        if (Test-Path -LiteralPath $target) {
            if (Test-Path -LiteralPath (Join-Path $target 'SKILL.md')) {
                Write-Host "Already present (not overwritten): $($spec.Name)"
                continue
            }
            Write-Warning "Existing directory has no SKILL.md: $target"
            $failedSkills += $spec.Name
            continue
        }
        & $mvPython $installer --repo $spec.Repo --path $spec.Path --name $spec.Name --dest $skillDest
        if ($LASTEXITCODE -ne 0) { $failedSkills += $spec.Name; continue }
        if (-not (Test-Path -LiteralPath (Join-Path $target 'SKILL.md'))) { $failedSkills += $spec.Name }
    }
    if ($failedSkills.Count -gt 0) { throw "Skills not installed: $($failedSkills -join ', ')" }
    Write-Host 'All four skill entries are present. Start a new Codex turn to load them.'
}
Write-Host 'Setup completed. Whisper model weights will be downloaded separately when a model is selected.'
