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

const search = document.getElementById("pet-search");
if (search) {
  let activeFilter = "all";
  const filterButtons = document.querySelectorAll("[data-filter]");
  function updateCatalog() {
    const query = search.value.trim().toLocaleLowerCase("ru");
    let count = 0;
    document.querySelectorAll("[data-pet-card]").forEach(card => {
      const matches = (activeFilter === "all" || card.dataset.type === activeFilter)
        && card.dataset.name.includes(query);
      card.hidden = !matches;
      if (matches) count += 1;
    });
    document.getElementById("pet-count").textContent = "Найдено питомцев: " + count;
    document.getElementById("empty-catalog").hidden = count !== 0;
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
  adoptForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!adoptForm.reportValidity()) return;
    const data = new FormData(adoptForm);
    const pet = shelterPets.find(item => String(item.id) === data.get("pet"));
    const text = "АНКЕТА БУДУЩЕГО ХОЗЯИНА — ТЁПЛЫЙ ДОМ\n"
      + "Учебный документ. Анкета не отправлена в приют.\n\n"
      + "Имя: " + data.get("name") + "\nEmail: " + data.get("email")
      + "\nТелефон: +7 " + data.get("phone") + "\nПитомец: " + (pet ? pet.name : "Помогите выбрать")
      + "\nУсловия проживания: " + data.get("home") + "\nО себе: " + data.get("about")
      + "\nСовершеннолетие, согласие семьи и согласие на локальную обработку данных подтверждены.\n";
    downloadApplication(text, "anketa-teply-dom.txt");
    showMessage("adopt-result", "Анкета подготовлена для скачивания. Она не отправлена в приют. Данные не сохраняются на сервере.");
  });
  adoptForm.addEventListener("reset", () => {
    document.getElementById("adopt-result").hidden = true;
    adoptForm.querySelectorAll("input").forEach(input => input.setCustomValidity(""));
  });
}

const quickModal = document.getElementById("orderModal");
if (quickModal) {
  quickModal.addEventListener("show.bs.modal", event => {
    const id = event.relatedTarget?.dataset.petId || "1";
    const pet = shelterPets.find(item => String(item.id) === id) || shelterPets[0];
    const form = document.getElementById("quick-form");
    form.reset();
    form.elements.phone.setCustomValidity("");
    form.elements.pet.value = pet.name;
    document.getElementById("modal-pet-label").textContent = pet.name;
    document.getElementById("quick-result").hidden = true;
  });
  quickModal.addEventListener("shown.bs.modal", () => document.getElementById("quick-name").focus());
  document.getElementById("quick-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    downloadApplication("ЗАЯВКА НА ЗНАКОМСТВО — ТЁПЛЫЙ ДОМ\nУчебный документ. Не отправлен в приют.\n\n"
      + "Питомец: " + data.get("pet") + "\nИмя: " + data.get("name") + "\nТелефон: " + data.get("phone")
      + "\nСовершеннолетие и согласие на локальную обработку данных подтверждены.\n", "znakomstvo-teply-dom.txt");
    showMessage("quick-result", "Заявка подготовлена для скачивания. Она не отправлена в приют.");
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
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    amount.value = button.dataset.amount;
    updateAmountButtons();
  }));
  amount.addEventListener("input", updateAmountButtons);
  donation.addEventListener("submit", event => {
    event.preventDefault();
    if (!donation.reportValidity()) return;
    showMessage("donate-result", "Спасибо за желание помочь на " + Number(amount.value).toLocaleString("ru-RU")
      + " ₽! Это демонстрация: пожертвование не совершено. Для реальной помощи свяжитесь с приютом.");
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
const floatingTop = document.getElementById("floating-top");
function updateTopButton() { if (floatingTop) floatingTop.hidden = window.scrollY < 350; }
window.addEventListener("scroll", updateTopButton, { passive: true });
updateTopButton();
