// navigation.js
// Handles the mobile nav toggle and marks the current page's
// nav link with aria-current="page" for styling + accessibility.

(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const links = document.querySelectorAll(".main-nav a");
  const current = window.location.pathname.split("/").pop() || "index.html";

  links.forEach((link) => {
    const href = link.getAttribute("href").split("/").pop();
    if (href === current) {
      link.setAttribute("aria-current", "page");
    }
  });
})();
