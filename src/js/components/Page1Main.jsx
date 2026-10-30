import { useCallback, useEffect, useState } from "react";
import { copyImageToClipboard } from "copy-image-clipboard";

import { createEmptyProductData } from "./product-data.js";
import { syncDailyValuePercent } from "./daily-values.js";
import { calculateCalories } from "./calorie-calculation.js";
import { renderNutritionFacts } from "./nutrition-facts.js";
import { createBatchSvg, convertSvgToPng, downloadSvg, safeFilename, b64toBlob } from "./export.js";
import Sidebar from "./components/Sidebar.jsx";
import ProductTabs from "./components/ProductTabs.jsx";
import ProductEditor, { NutrientFields } from "./components/ProductEditor.jsx";
import PreviewPanel from "./components/PreviewPanel.jsx";

let nextProductId = 2;

function createProduct() {
  return {
    id: `product-${nextProductId++}`,
    name: "",
    data: createEmptyProductData(),
  };
}

function isReady(product) {
  const { data } = product;
  return Boolean(
    data.product_name.trim() &&
    data.serving_info.serving_size.trim() &&
    Number(data.serving_info.servings_per_container) > 0 &&
    Number.isInteger(Number(data.calories)) &&
    Number(data.calories) >= 0,
  );
}

function Page1Main() {
  const [products, setProducts] = useState(() => [createProduct()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [automaticCalories, setAutomaticCalories] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filename, setFilename] = useState("nutrition-label.svg");
  const [exportStatus, setExportStatus] = useState("Sẵn sàng xuất SVG");
  const [svgCode, setSvgCode] = useState("");
  const activeProduct = products[activeIndex];
  const ready = isReady(activeProduct);

  // Mỗi lần sửa dữ liệu, chỉ thay sản phẩm đang mở để các tab khác giữ nguyên.
  const updateActiveProduct = useCallback(
    (changeData) => {
      setProducts((current) =>
        current.map((product, index) => {
          if (index !== activeIndex) return product;
          const data = changeData(product.data);
          return { ...product, name: data.product_name, data };
        }),
      );
    },
    [activeIndex],
  );

  //Đổi tên của file mỗi khi có thay đổi của products
  useEffect(() => {
    setFilename(safeFilename(products[activeIndex]?.name, `Ảnh ${activeIndex + 1}`, "svg"));
    return () => {
      //what?;
    };
  }, [activeIndex, products]);

  function addProduct() {
    setProducts((current) => [...current, createProduct()]);
    setActiveIndex(products.length);
  }

  function closeProduct(index) {
    if (products.length === 1) {
      setExportStatus("Cần giữ lại ít nhất một sản phẩm.");
      return;
    }
    setProducts((current) => current.filter((_, productIndex) => productIndex !== index));
    if (index < activeIndex) setActiveIndex(activeIndex - 1);
    else if (index === activeIndex) setActiveIndex(Math.min(index, products.length - 2));
  }

  function changeBasic(field, value) {
    updateActiveProduct((current) => {
      const data = { ...current, serving_info: { ...current.serving_info } };
      if (field === "product_name") data.product_name = value;
      if (field === "serving_weight") data.serving_info.serving_weight = value;
      if (field === "serving_unit") data.serving_info.serving_unit = value;
      if (field === "servings_per_container") data.serving_info.servings_per_container = value;
      if (field === "calories") data.calories = value;

      const weight = data.serving_info.serving_weight;
      const unit = data.serving_info.serving_unit;
      data.serving_info.serving_size = weight ? (unit ? `${unit} (${weight}g)` : `${weight}g`) : "";
      return data;
    });
  }

  function changeNutrient(index, value) {
    updateActiveProduct((current) => {
      const nutrients = current.nutrients.map((nutrient, nutrientIndex) => {
        if (nutrientIndex !== index) return nutrient;
        const updated = { ...nutrient, value };
        syncDailyValuePercent(updated);
        return updated;
      });
      const data = { ...current, nutrients };
      if (automaticCalories) data.calories = calculateCalories(nutrients) ?? "";
      return data;
    });
  }

  function toggleAutomaticCalories(enabled) {
    setAutomaticCalories(enabled);
    if (enabled) {
      // Bật lại chế độ tự động thì cập nhật cả tab đang ẩn, để mỗi sản phẩm đều đúng.
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          data: {
            ...product.data,
            calories: calculateCalories(product.data.nutrients) ?? "",
          },
        })),
      );
    }
  }

  const updateSvgCode = useCallback((code) => setSvgCode(code), []);

  function exportCurrent() {
    if (!ready) {
      setExportStatus("Chưa có đủ thông tin để xuất nhãn.");
      return;
    }
    try {
      const svg = renderNutritionFacts(activeProduct.data);
      downloadSvg(svg, outputName);
      setExportStatus(`Đã xuất ${outputName}`);
    } catch (error) {
      setExportStatus(error.message);
    }
  }

  function exportAll() {
    if (!products.every(isReady)) {
      setExportStatus("Chưa có đủ thông tin ở tất cả sản phẩm để xuất.");
      return;
    }
    try {
      const outputName = safeFilename("nutrition-labels-all", "nutrition-labels-all", "svg");
      downloadSvg(createBatchSvg(products), outputName);
      setExportStatus(`Đã xuất ${products.length} nhãn trong ${outputName}`);
    } catch (error) {
      setExportStatus(error.message);
    }
  }

  async function copyImage() {
    try {
      const svg = renderNutritionFacts(activeProduct.data);
      const imageB64 = await convertSvgToPng(svg);

      await copyImageToClipboard(imageB64);
      console.log("copy thành công");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Sidebar open={menuOpen} onToggle={setMenuOpen} />
      <main className="main-content">
        <div className="content-area">
          <button
            className="menu-toggle"
            type="button"
            aria-controls="sidebar"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
          <ProductTabs
            products={products}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={addProduct}
            onClose={closeProduct}
          />

          <div className="workbench">
            <section className="upper-workspace" aria-label="Thông tin và xem trước nhãn">
              <ProductEditor
                data={activeProduct.data}
                automaticCalories={automaticCalories}
                onAutomaticCaloriesChange={toggleAutomaticCalories}
                onBasicChange={changeBasic}
                onNutrientChange={changeNutrient}
              />
              <PreviewPanel data={activeProduct.data} ready={ready} onSvgChange={updateSvgCode} />
              <section className="file-panel" aria-label="Tên file">
                <label className="form-field">
                  <span className="file-label">Tên file:</span>
                  <input
                    className="form-control"
                    type="text"
                    value={filename}
                    onChange={(event) => setFilename(event.target.value)}
                  />
                </label>
                <p className="file-hint">Sẽ tải xuống dưới dạng SVG.</p>
              </section>
            </section>

            <section className="lower-workspace" aria-label="Vi chất và xuất nhãn">
              <section className="micronutrient-panel" aria-label="Vitamin và khoáng chất">
                <h2>Mỗi khẩu phần</h2>
                <NutrientFields
                  nutrients={activeProduct.data.nutrients}
                  onChange={changeNutrient}
                  micros
                />
              </section>
              <section className="export-panel" aria-label="Xuất nhãn">
                <div className="export-one-image-div">
                  <button className="button button-primary" type="button" onClick={exportCurrent}>
                    Xuất ra file hình
                  </button>
                  <button className="button button-primary" type="button" onClick={copyImage}>
                    Copy ảnh
                  </button>
                </div>
                <button className="button" type="button" onClick={exportAll}>
                  Xuất toàn bộ
                </button>
                <output className="export-status" aria-live="polite">
                  {exportStatus}
                </output>
              </section>
              <section className="code-panel" aria-label="Mã SVG">
                <label className="code-label" htmlFor="svg-code">
                  SVG
                </label>
                <textarea
                  id="svg-code"
                  className="code-editor"
                  readOnly
                  spellCheck="false"
                  aria-label="Mã SVG đang xem trước"
                  value={svgCode}
                />
              </section>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default Page1Main;
