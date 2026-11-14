"use strict";

function showMessage(id, text) {
  const target = document.getElementById(id);
  if (!target) return;
  target.textContent = text;
  target.hidden = false;
}

function downloadApplication(text, filename) {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function applicationMailLink(subject, text) {
  return "mailto:hello@teply-dom.example?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
}

function prepareApplicationActions(prefix, subject, text, filename) {
  const actions = document.getElementById(prefix + "-actions");
  const email = document.getElementById(prefix + "-email");
  const download = document.getElementById(prefix + "-download");
  email.href = applicationMailLink(subject, text);
  download.onclick = () => downloadApplication(text, filename);
  actions.hidden = false;
}

const search = document.getElementById("pet-search");
if (search) {
  let activeFilter = "all";
  let favoritesOnly = false;
  const filterButtons = document.querySelectorAll("[data-filter]");
  const age = document.getElementById("pet-age");
  function updateCatalog() {
    const query = search.value.trim().toLocaleLowerCase("ru");
    let count = 0;
    document.querySelectorAll("[data-pet-card]").forEach(card => {
      const matches = (activeFilter === "all" || card.dataset.type === activeFilter)
        && (!favoritesOnly || window.shelterFavorites?.includes(Number(card.querySelector('a[href*="product.html?id="]')?.getAttribute("href").split("id=")[1])))
        && card.dataset.name.includes(query)
        && (age.value === "all" || card.dataset.ageGroup === age.value);
      card.hidden = !matches;
      if (matches) count += 1;
    });
    document.getElementById("pet-count").textContent = "Найдено питомцев: " + count;
    const empty = document.getElementById("empty-catalog");
    empty.hidden = count !== 0;
    if (count === 0) empty.textContent = favoritesOnly
      ? "Нет избранных питомцев с такими параметрами. Добавьте друга сердечком во вкладке «Все животные» или сбросьте фильтры."
      : "По вашему запросу питомцев не найдено. Попробуйте изменить поиск или сбросить фильтры.";
    const focused = document.activeElement;
    if (focused?.closest("[data-pet-card]")?.hidden) {
      const next = [...document.querySelectorAll("[data-pet-card]")].find(card => !card.hidden);
      (next?.querySelector("[data-favorite]") || document.getElementById("catalog-favorites-tab")).focus();
    }
    filterButtons.forEach(button => {
      const active = button.dataset.filter === activeFilter;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline-primary", !active);
    });
  }
  filterButtons.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    updateCatalog();
  }));
  search.addEventListener("input", updateCatalog);
  document.querySelectorAll("[data-catalog-view]").forEach(button => button.addEventListener("click", () => {
    favoritesOnly = button.dataset.catalogView === "favorites";
    document.querySelectorAll("[data-catalog-view]").forEach(tab => {
      const selected = tab === button;
      tab.setAttribute("aria-selected", String(selected)); tab.classList.toggle("active", selected);
    });
    document.getElementById("pet-grid").setAttribute("aria-labelledby", button.id);
    updateCatalog();
  }));
  document.addEventListener("favorites-changed", updateCatalog);
  age.addEventListener("change", updateCatalog);
  document.getElementById("reset-filters").addEventListener("click", () => {
    activeFilter = "all";

    search.value = "";
    age.value = "all";
    updateCatalog();
    search.focus();
  });
}

const detailPhoto = document.getElementById("detail-photo");
if (detailPhoto) {
  const requestedId = new URLSearchParams(location.search).get("id");
  const pet = shelterPets.find(item => String(item.id) === (requestedId || "1")) || shelterPets[0];
  if (requestedId && !shelterPets.some(item => String(item.id) === requestedId)) {
    showMessage("pet-warning", "Такого питомца нет в каталоге. Показана карточка Бруно; других друзей можно найти в каталоге.");
  }
  document.querySelectorAll("[data-pet-field]").forEach(element => {
    element.textContent = pet[element.dataset.petField];
  });
  detailPhoto.src = "images/pet-" + pet.id + ".jpg";
  detailPhoto.alt = (pet.type === "dog" ? "Собака " : "Кошка ") + pet.name;
  document.getElementById("detail-type").textContent = pet.type === "dog" ? "Собака" : "Кошка";
  document.getElementById("adopt-link").href = "order.html?pet=" + pet.id;
  document.getElementById("detail-quick").dataset.petId = String(pet.id);
  document.title = pet.name + " — карточка питомца — Тёплый дом";
}

// Дополняем нативную проверку формы проверкой количества цифр телефона.
document.querySelectorAll('input[type="tel"]').forEach(input => {
  input.addEventListener("input", () => {
    const count = input.value.replace(/\D/g, "").length;
    const national = input.id === "order-phone";
    input.setCustomValidity(!input.value || (national ? count === 10 : count >= 7 && count <= 15)
      ? "" : national ? "Введите 10 цифр номера без префикса +7." : "Введите от 7 до 15 цифр телефона.");
  });
});

const adoptForm = document.getElementById("adopt-form");
if (adoptForm) {
  const petId = new URLSearchParams(location.search).get("pet");
  if (shelterPets.some(pet => String(pet.id) === petId)) adoptForm.elements.pet.value = petId;
  function updateSelectedPet() {
    const pet = shelterPets.find(item => String(item.id) === adoptForm.elements.pet.value);
    document.getElementById("application-pet").hidden = !pet;
    if (!pet) return;
    document.getElementById("application-pet-photo").src = "images/pet-" + pet.id + ".jpg";
    document.getElementById("application-pet-photo").alt = pet.name;
    document.getElementById("application-pet-name").textContent = pet.name;
    document.getElementById("application-pet-age").textContent = pet.age + " · " + pet.sex;
    document.getElementById("application-pet-health").textContent = pet.health;
  }
  adoptForm.elements.pet.addEventListener("change", () => {
    updateSelectedPet();
    document.getElementById("adopt-actions").hidden = true;
    document.getElementById("adopt-result").hidden = true;
  });
  updateSelectedPet();
  adoptForm.addEventListener("input", () => {
    document.getElementById("adopt-actions").hidden = true;
    document.getElementById("adopt-result").hidden = true;
  });
  adoptForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!adoptForm.reportValidity()) return;
    const data = new FormData(adoptForm);
    const pet = shelterPets.find(item => String(item.id) === data.get("pet"));
    const text = "АНКЕТА БУДУЩЕГО ХОЗЯИНА — ТЁПЛЫЙ ДОМ\n"
      + "Скачанная анкета. Передайте её куратору приюта.\n\n"
      + "Имя: " + data.get("name") + "\nEmail: " + data.get("email")
      + "\nТелефон: +7 " + data.get("phone") + "\nПитомец: " + (pet ? pet.name : "Помогите выбрать")
      + "\nУсловия проживания: " + data.get("home") + "\nО себе: " + data.get("about")
      + "\nСовершеннолетие, согласие семьи и согласие на локальную обработку данных подтверждены.\n";
    prepareApplicationActions("adopt", "Заявка на усыновление: " + (pet ? pet.name : "помогите выбрать питомца"), text, "anketa-teply-dom.txt");
    showMessage("adopt-result", "Заявка подготовлена. Нажмите «Отправить заявку по почте» и подтвердите отправку в почтовой программе. Можно также скачать копию анкеты. До отправки письма приют не получает ваши данные.");
  });
  adoptForm.addEventListener("reset", () => {
    document.getElementById("adopt-result").hidden = true;
    document.getElementById("adopt-actions").hidden = true;
    setTimeout(updateSelectedPet, 0);
    adoptForm.querySelectorAll("input").forEach(input => input.setCustomValidity(""));
  });
}

const quickModal = document.getElementById("orderModal");
if (quickModal) {
  // Не выпускаем Tab в интерфейс браузера с крайних элементов окна.
  quickModal.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const elements = [...quickModal.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled])'
    )].filter(element => element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  quickModal.addEventListener("show.bs.modal", event => {
    const id = event.relatedTarget?.dataset.petId || "1";
    const pet = shelterPets.find(item => String(item.id) === id) || shelterPets[0];
    const form = document.getElementById("quick-form");
    form.reset();
    form.elements.phone.setCustomValidity("");
    form.elements.pet.value = pet.name;
    document.getElementById("modal-pet-label").textContent = pet.name;
    document.getElementById("quick-result").hidden = true;
    document.getElementById("quick-actions").hidden = true;
  });
  quickModal.addEventListener("shown.bs.modal", () => document.getElementById("quick-name").focus());
  document.getElementById("quick-form").addEventListener("input", () => {
    document.getElementById("quick-actions").hidden = true;
    document.getElementById("quick-result").hidden = true;
  });
  document.getElementById("quick-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const text = "ЗАЯВКА НА ЗНАКОМСТВО — ТЁПЛЫЙ ДОМ\nПередайте заявку куратору приюта.\n\n"
      + "Питомец: " + data.get("pet") + "\nИмя: " + data.get("name") + "\nТелефон: " + data.get("phone")
      + "\nСовершеннолетие и согласие на локальную обработку данных подтверждены.\n";
    prepareApplicationActions("quick", "Знакомство с питомцем: " + data.get("pet"), text, "znakomstvo-teply-dom.txt");
    showMessage("quick-result", "Заявка подготовлена. Откройте письмо кнопкой ниже и подтвердите отправку в почтовой программе. До этого приют не получает ваши данные.");
  });
}

const donation = document.getElementById("donate-form");
if (donation) {
  const amount = document.getElementById("donate-amount");
  const buttons = document.querySelectorAll("[data-amount]");
  function updateAmountButtons() {
    buttons.forEach(button => {
      const active = button.dataset.amount === amount.value;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline-primary", !active);
    });
    document.getElementById("donate-result").hidden = true;
    document.getElementById("donate-email").hidden = true;
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    amount.value = button.dataset.amount;
    updateAmountButtons();
  }));
  amount.addEventListener("input", updateAmountButtons);
  donation.addEventListener("submit", event => {
    event.preventDefault();
    if (!donation.reportValidity()) return;
    const formatted = Number(amount.value).toLocaleString("ru-RU");
    const email = document.getElementById("donate-email");
    email.href = applicationMailLink("Пожертвование приюту — " + formatted + " ₽", "Здравствуйте! Хочу помочь приюту пожертвованием на сумму " + formatted + " ₽. Пришлите, пожалуйста, актуальные реквизиты или ссылку для перевода.");
    email.hidden = false;
    showMessage("donate-result", "Вы выбрали пожертвование " + formatted + " ₽. Запросите реквизиты кнопкой ниже или позвоните в приют. Эта форма не списывает деньги.");
  });
}

const share = document.getElementById("share");
if (share) share.addEventListener("click", async () => {
  const url = new URL("catalog.html", location.href).href;
  try {
    await navigator.clipboard.writeText(url);
    document.getElementById("share-status").textContent = "Ссылка на каталог скопирована.";
  } catch {
    const fallback = document.getElementById("share-fallback");
    fallback.value = url;
    fallback.hidden = false;
    fallback.focus();
    fallback.select();
    document.getElementById("share-status").textContent = "Скопируйте выделенную ссылку вручную.";
  }
});

document.querySelectorAll("[data-back-top]").forEach(button => button.addEventListener("click", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
  document.getElementById("page-top").focus({ preventScroll: true });
}));
