const sidebar = document.querySelector(".vertical-panel");
const menuToggle = document.querySelector(".menu-toggle");
const overlay = document.querySelector(".sidebar-overlay");

function setMenuOpen(open) {
  sidebar.classList.toggle("open", open);
  overlay.classList.toggle("visible", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  document.body.classList.toggle("menu-open", open);
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(!sidebar.classList.contains("open"));
});

overlay.addEventListener("click", () => setMenuOpen(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) setMenuOpen(false);
});

document.getElementById("closeSidebar").addEventListener("click", () => {
  setMenuOpen(false);
  document.getElementById("menuToggle").focus();
});
