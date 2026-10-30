import { useEffect, useState } from "react";

export default function ProductTabs({ products, activeIndex, onSelect, onAdd, onClose }) {
  const [menu, setMenu] = useState(null);

  // Đóng menu chuột phải khi người dùng bấm ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    if (!menu) return undefined;
    const closeMenu = () => setMenu(null);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu]);

  function showMenu(event, index) {
    event.preventDefault();
    // Giữ menu trong khung nhìn, kể cả khi bấm chuột phải sát mép màn hình.
    setMenu({
      index,
      x: Math.min(event.clientX, window.innerWidth - 174),
      y: Math.min(event.clientY, window.innerHeight - 96),
    });
  }

  return (
    <>
      <nav className="product-tabs" aria-label="Sản phẩm" role="tablist">
        {products.map((product, index) => {
          const name = product.name || "Sản phẩm mới";
          return (
            <div
              className="product-tab"
              data-active={String(index === activeIndex)}
              key={product.id}
              onContextMenu={(event) => showMenu(event, index)}
            >
              <button
                className="tab-select"
                id={`product-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-controls="preview-stage"
                title={name}
                onClick={() => onSelect(index)}
              >
                {name}
              </button>
              <button
                className="tab-close"
                type="button"
                aria-label={`Đóng sản phẩm ${name}`}
                title={`Đóng ${name}`}
                onClick={() => onClose(index)}
              >
                x
              </button>
            </div>
          );
        })}
        <button
          className="add-product-tab"
          type="button"
          aria-label="Tạo sản phẩm mới"
          title="Tạo sản phẩm mới"
          onClick={onAdd}
        >
          +
        </button>
      </nav>

      {menu && (
        <div
          className="tab-context-menu"
          role="menu"
          style={{ left: Math.max(8, menu.x), top: Math.max(8, menu.y) }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenu(null);
              onAdd();
            }}
          >
            Tạo Sản phẩm mới
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={products.length === 1}
            onClick={() => {
              setMenu(null);
              onClose(menu.index);
            }}
          >
            Xoá Sản phẩm
          </button>
        </div>
      )}
    </>
  );
}
