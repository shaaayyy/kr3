"""Подготовка статических файлов для Sites; npm не требуется."""
from pathlib import Path
import shutil
from build_search import build_search
build_search()
root = Path(__file__).resolve().parents[1]
out = root / 'dist'
# Каталог dist генерируется из исходников, пользовательские данные в нём не хранятся.
if out.exists():
    shutil.rmtree(out)
out.mkdir()
for page in root.glob('*.html'):
    shutil.copy2(page, out / page.name)
for directory in ('css', 'js', 'images', 'vendor'):
    shutil.copytree(root / directory, out / directory)
print('Статическая версия готова: dist/')
