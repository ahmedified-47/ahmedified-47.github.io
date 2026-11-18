(function () {
  const root = document.documentElement;
  root.classList.add("js");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileNav = window.matchMedia("(max-width: 720px)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  function setNavOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
    if (mobileNav.matches && !open) nav.setAttribute("inert", "");
    else nav.removeAttribute("inert");
  }

  function syncNav() {
    if (!nav || !toggle) return;
    if (!mobileNav.matches) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
      nav.removeAttribute("inert");
      return;
    }
    setNavOpen(nav.classList.contains("is-open"));
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNavOpen(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mobileNav.matches) setNavOpen(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNavOpen(false);
    });
    mobileNav.addEventListener("change", syncNav);
    syncNav();
  }

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));

  function markCurrent() {
    let current = sections[0] ? sections[0].id : "";
    const line = window.scrollY + 120;
    sections.forEach(function (section) {
      if (section.offsetTop <= line) current = section.id;
    });
    navLinks.forEach(function (link) {
      const on = link.getAttribute("href") === "#" + current;
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  markCurrent();
  window.addEventListener("scroll", markCurrent, { passive: true });

  const reveals = Array.from(document.querySelectorAll(".reveal"));

  function showInView() {
    const cutoff = window.innerHeight * 0.92;
    reveals.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < cutoff && rect.bottom > 0) el.classList.add("is-in");
    });
  }

  if (reduced.matches) {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    showInView();
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
      );
      reveals.forEach(function (el) {
        if (!el.classList.contains("is-in")) observer.observe(el);
      });
    } else {
      reveals.forEach(function (el) {
        el.classList.add("is-in");
      });
    }
  }

  if (!reduced.matches && finePointer.matches) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          "rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }
})();
