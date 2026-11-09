"""Проверка локальных ресурсов, ссылок, сетки и базовой доступности без зависимостей."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
errors = []

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links, self.stack = path, set(), [], []
        self.labels, self.inputs, self.h1 = set(), [], 0
    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if a.get('id'):
            if a['id'] in self.ids: errors.append(f'{self.path.name}: повтор id={a["id"]}')
            self.ids.add(a['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'img' and not a.get('alt'): errors.append(f'{self.path.name}: нет alt изображения')
        if tag == 'label' and a.get('for'): self.labels.add(a['for'])
        if tag in {'input','select','textarea'} and a.get('type') != 'hidden': self.inputs.append(a)
        for key in ('href','src'):
            if a.get(key): self.links.append(a[key])
        if any(c.startswith('col-') for c in a.get('class','').split()):
            if not self.stack or 'row' not in self.stack[-1][1].get('class','').split():
                errors.append(f'{self.path.name}: колонка не является прямым ребёнком row')
        if tag not in VOID: self.stack.append((tag,a))
    def handle_endtag(self,tag):
        if tag in VOID: return
        if not self.stack or self.stack[-1][0] != tag:
            errors.append(f'{self.path.name}: нарушена вложенность тега {tag}')
        else: self.stack.pop()

pages = {}
for file in sorted(ROOT.glob('*.html')):
    parser = Page(file)
    text = file.read_text(encoding='utf-8')
    parser.feed(text)
    pages[file.name] = parser
    if parser.stack: errors.append(f'{file.name}: незакрытые теги')
    if parser.h1 != 1: errors.append(f'{file.name}: ожидается один h1')
    if 'lang="ru"' not in text or 'name="viewport"' not in text: errors.append(f'{file.name}: lang/viewport')
    if 'bootstrap@5.3.8/dist/css/bootstrap.min.css' not in text: errors.append(f'{file.name}: Bootstrap CSS CDN')
    if text.find('css/custom.css') < text.find('bootstrap.min.css'): errors.append(f'{file.name}: порядок CSS')
    if 'bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js' not in text: errors.append(f'{file.name}: JS Bundle')
    for item in parser.inputs:
        if item.get('id') not in parser.labels and not item.get('aria-label'):
            errors.append(f'{file.name}: поле без подписи {item.get("id")}')

for page in pages.values():
    for link in page.links:
        parts = urlsplit(link)
        if parts.scheme or parts.netloc: continue
        target = ROOT / (unquote(parts.path) or page.path.name)
        if not target.is_file(): errors.append(f'{page.path.name}: нет файла {link}')
        elif parts.fragment and target.suffix == '.html':
            if parts.fragment not in pages[target.name].ids: errors.append(f'{page.path.name}: нет якоря {link}')

required = {'index.html','catalog.html','product.html','order.html','help.html','news.html'}
if set(pages) != required: errors.append('Неверный набор страниц')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'OK: {len(pages)} страниц; локальные ссылки, ресурсы, якоря, id, подписи, вложенность HTML и колонки Bootstrap проверены.')
