(() => {
  "use strict";

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#primary-nav");

  if (toggle && nav) {
    const mobile = window.matchMedia("(max-width: 800px)");
    const label = toggle.querySelector(".menu-label");

    const setMenuOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "關閉選單" : "開啟選單";
    };

    toggle.hidden = false;
    nav.classList.add("nav-enhanced");

    toggle.addEventListener("click", () => {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href^="#"]');
      if (!link || !mobile.matches) return;
      const target = document.querySelector(link.getAttribute("href"));
      setMenuOpen(false);
      if (target instanceof HTMLElement) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (event.target instanceof Node && !nav.contains(event.target) && !toggle.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    mobile.addEventListener("change", () => {
      const focused = document.activeElement;
      const focusWouldBeHidden = mobile.matches && nav.contains(focused);
      const toggleWouldBeHidden = !mobile.matches && focused === toggle;
      setMenuOpen(false);
      if (focusWouldBeHidden) toggle.focus();
      if (toggleWouldBeHidden) nav.querySelector("a")?.focus();
    });
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window) || reducedMotion.matches) return;

  const elements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });

  for (const element of elements) {
    element.classList.add("reveal-pending");
    observer.observe(element);
  }

  window.requestAnimationFrame(() => {
    for (const element of elements) element.classList.add("reveal-ready");
  });

  reducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    observer.disconnect();
    for (const element of elements) element.classList.add("reveal-visible");
  });
})();
