"""Render the character source in the local browser; no external art assets."""
from pathlib import Path
import argparse
import subprocess
from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--page', default='character-sheet')
parser.add_argument('--height', type=int, default=2400)
args = parser.parse_args()
if args.page not in ('character-sheet', 'character-lyric-sheet'):
    raise ValueError('Unknown sheet')
profile = ROOT / '.cache/chrome-character-sheet'
profile.mkdir(parents=True, exist_ok=True)
dest = ROOT / (args.page + '.png')
command = [r'C:/Program Files/Google/Chrome/Application/chrome.exe', '--headless=new',
           '--no-first-run', '--no-default-browser-check', '--no-sandbox',
           '--disable-gpu-sandbox', '--in-process-gpu', '--disable-background-networking',
           '--disable-component-update', '--hide-scrollbars', '--force-device-scale-factor=1',
           f'--window-size=3200,{args.height}', '--allow-file-access-from-files',
           '--user-data-dir=' + str(profile), '--virtual-time-budget=15000',
           '--run-all-compositor-stages-before-draw', '--screenshot=' + str(dest),
           '--dump-dom', (ROOT / (args.page + '.html')).as_uri()]
result = subprocess.run(command, capture_output=True, timeout=150)
dom = result.stdout.decode('utf-8', errors='replace')
(ROOT / '.cache/character-sheet.browser.log').write_text(result.stderr.decode('utf-8', errors='replace'), encoding='utf-8')
if result.returncode or 'data-ready="true"' not in dom:
    (ROOT / '.cache/character-sheet.dom.html').write_text(dom, encoding='utf-8')
    raise RuntimeError('Character sheet render failed; see .cache logs')
with Image.open(dest) as image:
    assert image.size == (3200, args.height)
    assert max(ImageStat.Stat(image.convert('RGB')).stddev) > 15
print(f'Rendered {dest.name}: 3200x{args.height}, {dest.stat().st_size} bytes')
