"""Индекс основного содержимого страниц для поиска без сервера."""
from pathlib import Path
from html.parser import HTMLParser
import json

ROOT = Path(__file__).resolve().parents[1]

class MainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'main':
            self.active = True

    def handle_endtag(self, tag):
        if tag == 'main':
            self.active = False

    def handle_data(self, data):
        if self.active and data.strip():
            self.parts.append(data.strip())


def build_search():
    labels = {
        'index': ('Главная', 'Знакомство с приютом, питомцы и расположение на карте.'),
        'catalog': ('Каталог животных', 'Найдите друга по имени, виду и возрасту. Избранные питомцы.'),
        'product': ('Карточка питомца', 'Возраст, характер, здоровье и условия передачи животного.'),
        'order': ('Анкета усыновления', 'Заполните анкету будущего хозяина и подготовьте заявку.'),
        'help': ('Помощь приюту', 'Волонтёрство, необходимые вещи и пожертвования.'),
        'about': ('О приюте', 'История, контакты, адрес, ответы на вопросы и отзывы.'),
    }
    records = []
    for slug, (title, summary) in labels.items():
        parser = MainText()
        parser.feed((ROOT / (slug + '.html')).read_text())
        records.append(dict(title=title, url=slug + '.html', text=' '.join(parser.parts), summary=summary))
    records.extend([
        dict(title='Контакты и адрес', url='about.html#contacts', text='телефон почта телеграм telegram карта расположение часы работы', summary='Москва, ул. Добрая, 12. Ежедневно, 10:00–18:00.'),
        dict(title='Отзывы о приюте', url='about.html#reviews', text='отзыв оценка впечатления оставить написать', summary='Расскажите о своём визите и сохраните отзыв в браузере.'),
        dict(title='Часто задаваемые вопросы', url='about.html#faq', text='ответы вопросы условия усыновления', summary='Как взять питомца, подготовить дом и записаться на визит.'),
    ])
    (ROOT / 'js/search-data.js').write_text('"use strict";\nconst shelterSearchPages = ' + json.dumps(records, ensure_ascii=False) + ';\n')

if __name__ == '__main__':
    build_search()
    print('Поисковый индекс обновлён.')
