"use strict";
(() => {
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };
  const saved = read("shelter-favorites", []);
  window.shelterFavorites = Array.isArray(saved) ? saved.filter(id => shelterPets.some(pet => pet.id === id)) : [];
  const heart = '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 4.6c-2.1-2.1-5.5-1.9-7.5.2L12 6.1l-1.3-1.3c-2-2.1-5.4-2.3-7.5-.2-2.2 2.2-2.2 5.6 0 7.8L12 21l8.8-8.6c2.2-2.2 2.2-5.6 0-7.8Z"/></svg>';
  function refreshHearts() {
    document.querySelectorAll("[data-favorite]").forEach(button => {
      const active = window.shelterFavorites.includes(Number(button.dataset.favorite));
      const pet = shelterPets.find(p => p.id === Number(button.dataset.favorite));
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", (active ? "Убрать из избранного: " : "Добавить в избранное: ") + pet.name);
      button.title = active ? "Убрать из избранного" : "Добавить в избранное";
      button.classList.toggle("is-favorite", active);
    });
  }
  function favoriteButton(id) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "favorite-button";
    button.dataset.favorite = String(id);
    button.innerHTML = heart;
    button.addEventListener("click", () => {
      const active = window.shelterFavorites.includes(id);
      const next = active ? window.shelterFavorites.filter(item => item !== id) : [...window.shelterFavorites, id];
      if (!save("shelter-favorites", next)) {
        document.getElementById("favorite-status").textContent = "Не удалось сохранить избранное. Разрешите хранение данных в браузере.";
        return;
      }
      window.shelterFavorites = next;
      refreshHearts();
      document.dispatchEvent(new Event("favorites-changed"));
      document.getElementById("favorite-status").textContent = active ? "Питомец убран из избранного." : "Питомец добавлен в избранное. Найти его можно в каталоге с фильтром «Только избранные».";
    });
    return button;
  }
  document.querySelectorAll(".pet-card").forEach(card => {
    const link = card.querySelector('a[href*="product.html?id="]');
    if (!link) return;
    const id = Number(new URL(link.href).searchParams.get("id"));
    if (!shelterPets.some(pet => pet.id === id)) return;
    card.append(favoriteButton(id));
  });
  if (document.getElementById("detail-photo")) {
    const id = Number(new URL(document.getElementById("adopt-link").href).searchParams.get("pet"));
    const button = favoriteButton(id);
    button.classList.add("favorite-detail");
    document.getElementById("adopt-link").parentElement.append(button);
  }
  refreshHearts();
  window.addEventListener("storage", event => {
    if (event.key !== "shelter-favorites" && event.key !== null) return;
    const value = read("shelter-favorites", []);
    window.shelterFavorites = Array.isArray(value) ? value.filter(id => shelterPets.some(p => p.id === id)) : [];
    refreshHearts();
    document.dispatchEvent(new Event("favorites-changed"));
  });

  const normalize = value => value.toLocaleLowerCase("ru").replaceAll("ё", "е");
  const query = document.getElementById("site-query");
  const results = document.getElementById("site-search-results");
  const records = [...shelterSearchPages, ...shelterPets.map(pet => ({ title: pet.name + " — " + pet.age, url: "product.html?id=" + pet.id, text: [pet.name, pet.age, pet.type === "cat" ? "кошка кот" : "собака пес", pet.desc, pet.character, pet.health].join(" "), summary: pet.desc }))];
  function searchSite() {
    const terms = normalize(query.value.trim()).split(/\s+/).filter(Boolean);
    results.replaceChildren();
    const found = terms.length ? records.filter(item => terms.every(term => normalize(item.title + " " + item.text).includes(term))) : [];
    document.getElementById("site-search-count").textContent = !terms.length ? "Ищите по имени питомца, теме или названию раздела." : found.length ? "Найдено: " + found.length : "Ничего не найдено. Попробуйте другой запрос.";
    found.sort((a, b) => terms.filter(term => normalize(b.title).includes(term)).length - terms.filter(term => normalize(a.title).includes(term)).length);
    found.forEach(item => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = item.url;
      const title = document.createElement("strong"); title.textContent = item.title;
      const description = document.createElement("span"); description.textContent = item.summary;
      link.append(title, description); results.append(link);
    });
  }
  const searchForm = document.getElementById("site-search-form");
  const searchPanel = document.getElementById("site-search-panel");
  function toggleSearch(open) {
    searchPanel.hidden = !open;
    query.setAttribute("aria-expanded", String(open));
  }
  query.addEventListener("input", () => { searchSite(); toggleSearch(true); });
  query.addEventListener("focus", () => { searchSite(); toggleSearch(true); });
  searchForm.addEventListener("submit", event => {
    event.preventDefault(); searchSite(); toggleSearch(true);
    results.querySelector("a")?.focus();
  });
  searchForm.addEventListener("keydown", event => {
    if (event.key === "Escape") { query.focus(); toggleSearch(false); }
    if (event.key === "ArrowDown" && event.target === query) {
      event.preventDefault(); searchSite(); toggleSearch(true); results.querySelector("a")?.focus();
    }
  });
  document.addEventListener("pointerdown", event => {
    if (!searchForm.contains(event.target)) toggleSearch(false);
  });
  searchForm.addEventListener("focusout", event => {
    if (!searchForm.contains(event.relatedTarget)) toggleSearch(false);
  });

  const chatLog = document.getElementById("chat-log");
  function answer(text) {
    const q = normalize(text);
    if (/пожертв|помо|корм|волонтер|деньг/.test(q)) return "Помочь можно кормом, вещами, прогулками или пожертвованием. Откройте раздел «Помощь приюту». Для реквизитов позвоните: +7 (495) 123-45-67. Онлайн-оплата пока не подключена.";
    if (/прие|адрес|врем|час|запис|контакт|телефон/.test(q)) return "Мы находимся по адресу: Москва, ул. Добрая, 12. Работаем ежедневно с 10:00 до 18:00. Перед визитом запишитесь по телефону +7 (495) 123-45-67. Карта находится на главной и в разделе «О приюте».";
    if (/взять|забрат|усынов|анкет|питом|животн|собак|кошк/.test(q)) return "Выберите питомца в каталоге и нажмите «Хочу забрать домой». Заполните анкету, подготовьте письмо и подтвердите отправку в почтовой программе. Животные передаются бесплатно после знакомства и согласования с куратором.";
    if (/привет|здравств/.test(q)) return "Здравствуйте! Чем помочь: выбор питомца, помощь приюту или запись на визит?";
    return "Я автоматический помощник и пока не могу ответить на этот вопрос. Сотрудник приюта поможет по телефону +7 (495) 123-45-67 или по почте hello@teply-dom.example. Контакты на сайте вымышленные.";
  }
  function sendChat(text) {
    text = text.trim(); if (!text) return;
    if (chatLog.children.length > 60) chatLog.replaceChildren();
    const message = document.createElement("p"); message.className = "chat-bubble chat-user"; message.textContent = "Вы: " + text;
    const reply = document.createElement("p"); reply.className = "chat-bubble"; reply.textContent = "Помощник: " + answer(text);
    chatLog.append(message, reply); chatLog.scrollTop = chatLog.scrollHeight;
  }
  document.getElementById("chat-form").addEventListener("submit", event => {
    event.preventDefault(); const input = document.getElementById("chat-message"); sendChat(input.value); input.value = ""; input.focus();
  });
  document.querySelectorAll("[data-chat-question]").forEach(button => button.addEventListener("click", () => sendChat(button.dataset.chatQuestion)));
  const chatWidget = document.getElementById("chat-widget");
  const chatToggle = document.getElementById("chat-toggle");
  function toggleChat(open) {
    chatWidget.hidden = !open;
    chatToggle.setAttribute("aria-expanded", String(open));
    chatToggle.setAttribute("aria-label", open ? "Свернуть чат с консультантом" : "Открыть чат с консультантом");
    if (open) {
      toggleSearch(false);
      document.getElementById("chat-message").focus();
      chatLog.scrollTop = chatLog.scrollHeight;
    } else chatToggle.focus();
  }
  chatToggle.addEventListener("click", () => toggleChat(chatWidget.hidden));
  document.getElementById("chat-close").addEventListener("click", () => toggleChat(false));
  chatWidget.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); toggleChat(false); }
  });

  const form = document.getElementById("review-form");
  if (form) {
    const stored = read("shelter-reviews", []);
    let reviews = Array.isArray(stored) ? stored.filter(r => r && typeof r.name === "string" && typeof r.text === "string" && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5 && Number.isFinite(r.date)).slice(0, 30) : [];
    function renderReviews() {
      const list = document.getElementById("review-list"); list.replaceChildren();
      if (!reviews.length) { const empty = document.createElement("p"); empty.className = "small text-body-secondary"; empty.textContent = "Здесь появятся ваши сохранённые отзывы."; list.append(empty); }
      reviews.forEach((review, index) => {
        const article = document.createElement("article"); article.className = "review-card";
        const heading = document.createElement("h3"); heading.className = "h6"; heading.textContent = review.name;
        const meta = document.createElement("p"); meta.className = "small text-success"; meta.textContent = "★".repeat(review.rating) + " · " + new Date(review.date).toLocaleDateString("ru-RU"); meta.setAttribute("aria-label", "Оценка " + review.rating + " из 5. " + new Date(review.date).toLocaleDateString("ru-RU"));
        const text = document.createElement("p"); text.className = "review-text"; text.textContent = review.text;
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "btn btn-sm btn-outline-secondary"; remove.textContent = "Удалить мой отзыв";
        remove.addEventListener("click", () => {
          const next = reviews.filter((_, i) => i !== index);
          if (!save("shelter-reviews", next)) { document.getElementById("review-status").textContent = "Не удалось удалить отзыв из хранилища браузера."; return; }
          reviews = next; renderReviews(); document.getElementById("review-name").focus();
          document.getElementById("review-status").textContent = "Отзыв удалён.";
        });
        article.append(heading, meta, text, remove); list.append(article);
      });
    }
    form.addEventListener("submit", event => {
      event.preventDefault(); if (!form.reportValidity()) return;
      const name = document.getElementById("review-name").value.trim(); const text = document.getElementById("review-text").value.trim();
      const status = document.getElementById("review-status");
      if (!name || text.length < 10) { status.textContent = "Укажите имя и напишите не менее 10 символов, кроме пробелов."; return; }
      if (reviews.length >= 30) { status.textContent = "Сохранено 30 отзывов. Удалите один из старых, чтобы добавить новый."; return; }
      const next = [{ name, text, rating: Number(document.getElementById("review-rating").value), date: Date.now() }, ...reviews];
      if (!save("shelter-reviews", next)) { status.textContent = "Не удалось сохранить отзыв. Проверьте доступность хранилища браузера."; return; }
      reviews = next; form.reset(); renderReviews(); status.textContent = "Спасибо! Отзыв сохранён в этом браузере.";
    });
    renderReviews();
  }
})();
