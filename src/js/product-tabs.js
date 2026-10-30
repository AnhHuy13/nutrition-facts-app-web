export function createProductTabs({
  tabs,
  addButton,
  contextMenu,
  getProducts,
  getActiveIndex,
  onSelect,
  onAdd,
  onClose,
}) {
  let contextProductIndex = getActiveIndex();

  function openContextMenu(x, y) {
    contextMenu.hidden = false;
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    contextMenu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8))}px`;
    contextMenu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8))}px`;
    contextMenu.querySelector('[data-action="delete"]').disabled = getProducts().length === 1;
  }

  function draw() {
    const products = getProducts();
    const activeIndex = getActiveIndex();
    tabs.replaceChildren(addButton);
    products.forEach((product, index) => {
      const tab = document.createElement("div");
      tab.className = "product-tab";
      tab.dataset.active = String(index === activeIndex);

      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "tab-select";
      selectButton.id = `product-tab-${index}`;
      selectButton.role = "tab";
      selectButton.setAttribute("aria-selected", String(index === activeIndex));
      selectButton.setAttribute("aria-controls", "preview-stage");
      selectButton.textContent = product.name || "Sản phẩm mới";
      selectButton.title = product.name || "Sản phẩm mới";
      selectButton.addEventListener("click", () => onSelect(index));

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "tab-close";
      closeButton.setAttribute("aria-label", `Đóng sản phẩm ${product.name}`);
      closeButton.title = `Đóng ${product.name}`;
      closeButton.textContent = "×";
      closeButton.addEventListener("click", (event) => onClose(index, event));

      tab.append(selectButton, closeButton);
      tab.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        contextProductIndex = index;
        openContextMenu(event.clientX, event.clientY);
      });
      tabs.insertBefore(tab, addButton);
    });
  }

  addButton.addEventListener("click", onAdd);
  contextMenu.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "create") onAdd();
    if (action === "delete") onClose(contextProductIndex, { stopPropagation() {} });
  });
  document.addEventListener("pointerdown", (event) => {
    if (!contextMenu.hidden && !contextMenu.contains(event.target)) contextMenu.hidden = true;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") contextMenu.hidden = true;
  });

  return {
    draw,
    hideContextMenu() {
      contextMenu.hidden = true;
    },
  };
}
