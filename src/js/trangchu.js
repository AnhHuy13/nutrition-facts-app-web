import { renderNutritionFacts } from "./nutrition-facts.js";
import { createEmptyProductData } from "./product-data.js";
import { createNutrientEditors } from "./nutrient-editors.js";
import { createProductTabs } from "./product-tabs.js";
import {
  createBatchSvg,
  downloadSvg,
  safeFilename,
  convertSVGtoPNG,
  downloadPng,
} from "./export.js";
import { syncDailyValuePercent } from "./daily-values.js";
import { calculateCalories } from "./calorie-calculation.js";

const products = [{ name: "", data: createEmptyProductData() }];
let activeProductIndex = 0;

const tabs = document.querySelector("#product-tabs");
const preview = document.querySelector("#preview-stage");
const macroFields = document.querySelector("#macro-fields");
const microFields = document.querySelector("#micro-fields");
const codeEditor = document.querySelector("#svg-code");
const productName = document.querySelector("#product-name");
const servingWeight = document.querySelector("#serving-weight");
const servingUnit = document.querySelector("#serving-unit");
const servingsCount = document.querySelector("#servings-count");
const caloriesInput = document.querySelector("#calories-input");
const autoCalories = document.querySelector("#auto-calories");
const filenameInput = document.querySelector("#filename-input");
const exportStatus = document.querySelector("#export-status");
const tabContextMenu = document.querySelector("#tab-context-menu");
const productTabs = createProductTabs({
  tabs,
  addButton: document.querySelector("#add-product"),
  contextMenu: tabContextMenu,
  getProducts: () => products,
  getActiveIndex: () => activeProductIndex,
  onSelect: selectProduct,
  onAdd: addProduct,
  onClose: closeProduct,
});

function addProduct() {
  products.push({ name: "", data: createEmptyProductData() });
  activeProductIndex = products.length - 1;
  productTabs.hideContextMenu();
  showProductInputs();
  productName.focus();
  productName.select();
}

function closeProduct(index, event) {
  event.stopPropagation();
  if (products.length === 1) {
    exportStatus.textContent = "Cần giữ lại ít nhất một sản phẩm.";
    return;
  }
  products.splice(index, 1);
  if (index < activeProductIndex) activeProductIndex -= 1;
  else if (index === activeProductIndex) activeProductIndex = Math.min(index, products.length - 1);
  productTabs.hideContextMenu();
  showProductInputs();
}

function showProductInputs() {
  const data = products[activeProductIndex].data;
  productName.value = data.product_name;
  servingsCount.value = data.serving_info.servings_per_container ?? "";
  caloriesInput.value = data.calories ?? "";
  const servingMatch = data.serving_info.serving_size.match(/([\d.]+)\s*g\)?\s*$/i);
  servingWeight.value = servingMatch ? servingMatch[1] : "";
  servingUnit.value = data.serving_info.serving_unit || "";
  createNutrientEditors(data, macroFields, microFields);
  productTabs.draw();
  renderPreview();
}

function syncInputsToProduct() {
  const data = products[activeProductIndex].data;
  const weight = servingWeight.value.trim() === "" ? null : Number(servingWeight.value);
  data.product_name = productName.value.trim();
  data.serving_info.servings_per_container =
    servingsCount.value.trim() === "" ? "" : Number(servingsCount.value);
  data.serving_info.serving_unit = servingUnit.value.trim();
  data.serving_info.serving_size =
    weight === null
      ? ""
      : data.serving_info.serving_unit
        ? `${data.serving_info.serving_unit} (${weight}g)`
        : `${weight}g`;
  data.calories = caloriesInput.value.trim() === "" ? "" : Number(caloriesInput.value);
  document.querySelectorAll(".number-input[data-nutrient-index]").forEach((input) => {
    const nutrient = data.nutrients[Number(input.dataset.nutrientIndex)];
    nutrient[input.dataset.nutrientProperty] = input.value.trim() === "" ? "" : Number(input.value);
    syncDailyValuePercent(nutrient);
  });
  if (autoCalories.checked) {
    const calculatedCalories = calculateCalories(data.nutrients);
    data.calories = calculatedCalories ?? "";
    caloriesInput.value = calculatedCalories ?? "";
  }
  products[activeProductIndex].name = data.product_name;
  productTabs.draw();
}

function markInvalidFields(showErrors = true) {
  const required = [productName, servingWeight, servingsCount, caloriesInput];
  let valid = true;
  required.forEach((input) => {
    const missing = input.value.trim() === "";
    const malformed = !missing && !input.checkValidity();
    input.setAttribute("aria-invalid", String(showErrors && (missing || malformed)));
    input.classList.toggle("is-invalid", showErrors && (missing || malformed));
    valid = valid && !missing && !malformed;
  });
  document.querySelectorAll(".number-input[data-nutrient-index]").forEach((input) => {
    const missing = input.value.trim() === "";
    const malformed = !missing && !input.checkValidity();
    input.setAttribute("aria-invalid", String(showErrors && (missing || malformed)));
    input.classList.toggle("is-invalid", showErrors && (missing || malformed));
    valid = valid && !malformed;
  });
  return valid;
}

function showPreviewMessage(message) {
  const emptyState = document.createElement("p");
  emptyState.className = "preview-empty-state";
  emptyState.textContent = message;
  preview.replaceChildren(emptyState);
  codeEditor.value = "";
}

function renderPreview() {
  const data = products[activeProductIndex].data;
  if (!markInvalidFields(false)) {
    showPreviewMessage("Chưa có đủ thông tin để hiển thị nhãn.");
    return;
  }
  let svg;
  try {
    svg = renderNutritionFacts(data);
  } catch (error) {
    showPreviewMessage(`Chưa có nhãn để hiển thị: ${error.message}`);
    return;
  }
  preview.replaceChildren(svg);
  codeEditor.value = new XMLSerializer().serializeToString(svg);
}

function handleInput() {
  syncInputsToProduct();
  markInvalidFields(false);
  renderPreview();
}

function selectProduct(index) {
  activeProductIndex = index;
  productTabs.hideContextMenu();
  showProductInputs();
}

function exportCurrent() {
  if (!markInvalidFields()) {
    exportStatus.textContent = "Chưa có đủ thông tin để xuất nhãn.";
    return;
  }
  syncInputsToProduct();
  downloadSvg(
    renderNutritionFacts(products[activeProductIndex].data),
    safeFilename(filenameInput.value, "nutrition-label"),
  );
  exportStatus.textContent = `Đã xuất ${safeFilename(filenameInput.value, "nutrition-label")}`;
}

function exportAll() {
  if (
    !markInvalidFields() ||
    products.some(
      ({ data }) =>
        !data.product_name.trim() ||
        !data.serving_info.serving_size.trim() ||
        !Number.isFinite(Number(data.serving_info.servings_per_container)) ||
        !Number.isInteger(Number(data.calories)) ||
        data.nutrients.some(
          (nutrient) => nutrient.value !== "" && !Number.isFinite(Number(nutrient.value)),
        ),
    )
  ) {
    exportStatus.textContent = "Chưa có đủ thông tin ở tất cả sản phẩm để xuất.";
    return;
  }
  syncInputsToProduct();
  downloadSvg(createBatchSvg(products), "nutrition-labels-all.svg");
  exportStatus.textContent = `Đã xuất ${products.length} nhãn trong nutrition-labels-all.svg`;
}

function copyToClipboard() {
  if (!markInvalidFields()) {
    exportStatus.textContent = "Chưa có đủ thông tin để xuất nhãn.";
    return;
  }
  syncInputsToProduct();
  var base64Img = convertSVGtoPNG();
  downloadPng(base64Img, safeFilename(filenameInput.value, "nutrition-label"));
}

document.querySelector(".product-basics").addEventListener("input", handleInput);
macroFields.addEventListener("input", handleInput);
microFields.addEventListener("input", handleInput);
autoCalories.addEventListener("change", () => {
  caloriesInput.disabled = autoCalories.checked;
  handleInput();
});
caloriesInput.disabled = autoCalories.checked;
document.querySelector("#export-current").addEventListener("click", exportCurrent);
document.querySelector("#export-all").addEventListener("click", exportAll);

productTabs.draw();
showProductInputs();
