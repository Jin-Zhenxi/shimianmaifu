# Run from the project root. Uses only the project's Conda FFmpeg and local browser.
$ErrorActionPreference = 'Stop'
$mvRoot = $PSScriptRoot
$env:HYPERFRAMES_NO_TELEMETRY = '1'
$env:PRODUCER_EXPERIMENTAL_FAST_CAPTURE = 'true'
$env:HYPERFRAMES_BROWSER_PATH = (Get-ChildItem -LiteralPath "$mvRoot\.cache\hyperframes-browser" -Recurse -Filter chrome-headless-shell.exe | Select-Object -First 1).FullName
$env:HYPERFRAMES_FFMPEG_PATH = "$mvRoot\.conda\mv\Library\bin\ffmpeg.exe"
$env:HYPERFRAMES_FFPROBE_PATH = "$mvRoot\.conda\mv\Library\bin\ffprobe.exe"
Set-Location -LiteralPath $mvRoot
& "$mvRoot\.conda\mv\python.exe" "$mvRoot\prepare_full_mv.py"
& node --preserve-symlinks --preserve-symlinks-main "$mvRoot\node_modules\hyperframes\bin\hyperframes.mjs" render "$mvRoot\mv" --quality looks --workers 1 --output "$mvRoot\review\mv-r1-render.mp4"
if ($LASTEXITCODE -ne 0) { throw 'HyperFrames export failed; inspect its output.' }
& "$mvRoot\.conda\mv\python.exe" "$mvRoot\finalize_full_mv.py"
