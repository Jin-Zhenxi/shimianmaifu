"""Render the actual browser canvases; no image-generation model or post-style filter."""
import argparse
import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parent
CHROME = Path('C:/Program Files/Google/Chrome/Application/chrome.exe')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('styles', nargs='*', default=['pixel', 'collage', 'crayon'])
    ap.add_argument('--budget', type=int, default=15000)
    args = ap.parse_args()
    for name in args.styles:
        if name not in ('pixel', 'collage', 'crayon'):
            raise ValueError(name)
        profile = ROOT.parent / '.cache' / ('chrome-style-' + name)
        profile.mkdir(parents=True, exist_ok=True)
        dest = ROOT / (name + '.png')
        command = [str(CHROME), '--headless=new', '--no-first-run', '--no-default-browser-check',
                   '--no-sandbox', '--disable-gpu-sandbox', '--in-process-gpu',
                   '--disable-background-networking', '--disable-component-update',
                   '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1920,1080',
                   '--allow-file-access-from-files', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
                   '--user-data-dir=' + str(profile), '--virtual-time-budget=' + str(args.budget),
                   '--run-all-compositor-stages-before-draw', '--screenshot=' + str(dest),
                   '--dump-dom', (ROOT / 'index.html').as_uri() + '?style=' + name]
        print('Rendering ' + name, flush=True)
        t = time.monotonic()
        result = subprocess.run(command, capture_output=True, timeout=150)
        dom = result.stdout.decode('utf-8', errors='replace')
        (ROOT / (name + '.browser.log')).write_text(result.stderr.decode('utf-8', errors='replace'), encoding='utf-8')
        (ROOT / (name + '.dom.html')).write_text(dom, encoding='utf-8')
        ready = 'data-ready="true"' in dom
        if result.returncode or not ready or not dest.exists():
            raise RuntimeError(f'{name}: browser exit={result.returncode}, ready={ready}; inspect browser log and DOM')
        from PIL import Image, ImageStat
        with Image.open(dest) as image:
            if image.size != (1920, 1080) or max(ImageStat.Stat(image.convert('RGB')).stddev) < 15:
                raise RuntimeError(f'{name}: wrong dimensions or nearly blank capture')
        print(f'{name}: ready, {dest.stat().st_size} bytes, {time.monotonic()-t:.1f}s', flush=True)
    print(json.dumps({'rendered':args.styles, 'output_size':[1920,1080]}))


if __name__ == '__main__':
    main()
