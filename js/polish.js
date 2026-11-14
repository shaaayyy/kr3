"use strict";
// Однократное появление карточек. Без JS содержимое остаётся видимым.
(() => {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (motion.matches) return;
      entry.target.animate([
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 460, delay: Number(entry.target.dataset.revealDelay || 0), fill: "backwards", easing: "cubic-bezier(.2,.7,.3,1)" });
    });
  }, { threshold: .08 });
  document.querySelectorAll(".pet-card, .review-card, .about-story-card, .shelter-feature, .about-help-card").forEach((element, index) => {
    element.dataset.revealDelay = String((index % 3) * 55);
    observer.observe(element);
  });
  motion.addEventListener("change", event => { if (event.matches) observer.disconnect(); });
})();
