/*
 * Copyright (C) 2026 AnhHuy13
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * SVG renderer ported from _python/nutrition_facts/generator.py.
 * renderNutritionFacts(data) returns an SVGElement.
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_WIDTH = 675;
const POINTS_PER_INCH = 72;
const LABEL_WIDTH_INCHES = 2.25;
const FOOTNOTE =
  "* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.";

const POINTS = {
  box: 0.5,
  inset: 3,
  ruleHeavy: 7,
  ruleMedium: 3,
  ruleHairline: 0.25,
  hairlinePad: 2,
  servings: 10,
  servingsLeading: 1,
  servingSize: 10,
  amount: 7.5,
  caloriesLabel: 16,
  caloriesValue: 22,
  dailyValueHeader: 6,
  nutrient: 8,
  nutrientLeading: 4,
  footnote: 6,
  footnoteLeading: 1,
  micro: 8,
  indentSub: 8,
  indentAdded: 16,
};

const SPACING_PT = {
  titleMinSize: 18, // Cỡ chữ nhỏ nhất của tiêu đề "Nutrition Facts".
  titleMaxSize: 36, // Cỡ chữ lớn nhất của tiêu đề "Nutrition Facts".
  titleRightInset: 1, // Khoảng đệm khi căn tiêu đề vừa với chiều rộng nhãn.
  afterTitle: 4, // Khoảng cách dưới tiêu đề, trước dòng số khẩu phần.
  servingSizeBottom: 2, // Khoảng cách dưới dòng khẩu phần, trước đường kẻ đậm.
  beforeAmountPerServing: 3, // Khoảng cách sau đường kẻ trên, trước "Amount per serving".
  amountBottom: 1, // Khoảng cách sau "Amount per serving", trước dòng calories.
  caloriesBottom: 10, // Khoảng cách dưới chữ calories, trước đường kẻ vừa.
  afterCaloriesRule: 4, // Khoảng cách dưới đường kẻ vừa, trước "% Daily Value*".
  dailyValueBottom: 1, // Khoảng cách dưới "% Daily Value*", trước đường kẻ mảnh.
  beforeNutrientRule: 2, // Khoảng cách sau chất đa lượng cuối, trước đường kẻ đậm.
  beforeMicronutrients: 2, // Khoảng cách phía trên nhóm vi chất.
  afterMicronutrients: 2, // Khoảng cách phía dưới nhóm vi chất.
  beforeFootnote: 2, // Khoảng cách dưới đường kẻ cuối, trước chú thích.
};

const NUTRIENT_ORDER = [
  "total fat",
  "saturated fat",
  "trans fat",
  "cholesterol",
  "sodium",
  "total carbohydrate",
  "total carbohydrates",
  "carbohydrates",
  "dietary fiber",
  "total sugars",
  "sugars",
  "added sugars",
  "protein",
  "vitamin d",
  "vit. d",
  "vit d",
  "calcium",
  "iron",
  "potassium",
  "potas.",
  "potas",
];
const MAIN_NUTRIENTS = new Set([
  "total fat",
  "cholesterol",
  "sodium",
  "total carbohydrate",
  "total carbohydrates",
  "carbohydrates",
  "protein",
]);
const SUB_NUTRIENTS = new Set([
  "saturated fat",
  "trans fat",
  "dietary fiber",
  "total sugars",
  "sugars",
]);
const MICRO_NUTRIENTS = new Set([
  "vitamin d",
  "vit. d",
  "vit d",
  "calcium",
  "iron",
  "potassium",
  "potas.",
  "potas",
]);
const ADDED_SUGARS = new Set(["added sugars", "includes added sugars"]);
const DISPLAY_NAMES = {
  carbohydrates: "Total Carbohydrate",
  "total carbohydrates": "Total Carbohydrate",
  sugars: "Total Sugars",
  "vitamin d": "Vitamin D",
  "vit. d": "Vitamin D",
  "vit d": "Vitamin D",
  potassium: "Potassium",
  "potas.": "Potassium",
  potas: "Potassium",
};
const MICRO_ABBREVIATIONS = {
  "vitamin d": "Vit. D",
  "vit. d": "Vit. D",
  "vit d": "Vit. D",
  potassium: "Potas.",
  "potas.": "Potas.",
  potas: "Potas.",
};

function normalizeName(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError("Nutrient values must be finite numbers.");
  if (Number.isInteger(number)) return String(number);
  return number.toPrecision(6).replace(/(?:\.0+|(?:(\.\d*?)0+))(e|$)/, "$1$2");
}

function formatAmount(nutrient) {
  return `${formatNumber(nutrient.value)}${nutrient.unit.trim()}`;
}

function formatDailyValue(nutrient) {
  return nutrient.daily_value_percent == null
    ? ""
    : `${formatNumber(nutrient.daily_value_percent)}%`;
}

function createSvgNode(tagName, attributes, parent) {
  const element = document.createElementNS(SVG_NS, tagName);
  for (const [name, value] of Object.entries(attributes || {})) {
    element.setAttribute(name, String(value));
  }
  if (parent) parent.appendChild(element);
  return element;
}

function createTextMeasurer() {
  if (typeof document === "undefined") {
    throw new Error("renderNutritionFacts requires a browser document.");
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas text measurement is unavailable.");

  function setFont(size, bold, italic = false) {
    context.font = `${italic ? "italic " : ""}${bold ? "900" : "400"} ${size}px ${
      bold ? '"Arial Black", Arial, sans-serif' : "Arial, Helvetica, sans-serif"
    }`;
  }

  function measure(text, size, bold = false, italic = false) {
    setFont(size, bold, italic);
    const metrics = context.measureText(text || "A");
    const width = Math.round(metrics.width);
    const height = Math.round(
      (metrics.fontBoundingBoxAscent ?? size * 0.8) +
        (metrics.fontBoundingBoxDescent ?? size * 0.2),
    );
    return [width, Math.max(1, height)];
  }

  function textBoundingHeight(text, size, bold = false, italic = false) {
    setFont(size, bold, italic);
    const metrics = context.measureText(text || "A");
    const ascent = metrics.actualBoundingBoxAscent ?? metrics.fontBoundingBoxAscent ?? size * 0.8;
    const descent =
      metrics.actualBoundingBoxDescent ?? metrics.fontBoundingBoxDescent ?? size * 0.2;
    return Math.max(1, Math.round(ascent + descent));
  }

  function fontDescent(text, size, bold = false) {
    setFont(size, bold);
    const metrics = context.measureText(text || "A");
    return Math.round(metrics.fontBoundingBoxDescent ?? size * 0.2);
  }

  function fontAscent(text, size, bold = false, italic = false) {
    setFont(size, bold, italic);
    const metrics = context.measureText(text || "A");
    return Math.round(metrics.fontBoundingBoxAscent ?? size * 0.8);
  }

  return { measure, textBoundingHeight, fontDescent, fontAscent };
}

/** Render a Nutrition Facts label and return it as an SVG element. */
export function renderNutritionFacts(data, options = {}) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Nutrition data must be an object.");
  }
  if (typeof data.product_name !== "string" || !data.product_name.trim()) {
    throw new TypeError("product_name must be a non-empty string.");
  }
  if (!data.serving_info || typeof data.serving_info !== "object") {
    throw new TypeError("serving_info is required.");
  }
  if (
    typeof data.serving_info.serving_size !== "string" ||
    !data.serving_info.serving_size.trim()
  ) {
    throw new TypeError("serving_info.serving_size must be a non-empty string.");
  }
  const servingsPerContainer = Number(data.serving_info.servings_per_container);
  if (!Number.isFinite(servingsPerContainer) || servingsPerContainer <= 0) {
    throw new TypeError("servings_per_container must be a positive number.");
  }
  const calories = Number(data.calories);
  if (!Number.isInteger(calories) || calories < 0) {
    throw new TypeError("calories must be a non-negative integer.");
  }
  const nutrients = data.nutrients ?? [];
  if (!Array.isArray(nutrients)) throw new TypeError("nutrients must be an array.");
  for (const nutrient of nutrients) {
    if (!nutrient || typeof nutrient.name !== "string" || !nutrient.name.trim()) {
      throw new TypeError("Each nutrient must have a non-empty name.");
    }
    if (!Number.isFinite(Number(nutrient.value)) || Number(nutrient.value) < 0) {
      throw new TypeError(`Nutrient '${nutrient.name}' must have a non-negative numeric value.`);
    }
    if (typeof nutrient.unit !== "string" || !nutrient.unit.trim()) {
      throw new TypeError(`Nutrient '${nutrient.name}' must have a unit.`);
    }
    if (
      nutrient.daily_value_percent != null &&
      (!Number.isFinite(Number(nutrient.daily_value_percent)) ||
        Number(nutrient.daily_value_percent) < 0)
    ) {
      throw new TypeError(`Nutrient '${nutrient.name}' has an invalid daily_value_percent.`);
    }
  }

  const width = Math.max(200, Math.round(Number(options.width) || DEFAULT_WIDTH));
  const pxPerPoint = width / (LABEL_WIDTH_INCHES * POINTS_PER_INCH);
  const pt = (points) => (points <= 0 ? 0 : Math.max(1, Math.round(points * pxPerPoint)));
  const leftInset = Math.max(1, pt(POINTS.box)) + pt(POINTS.inset);
  const left = leftInset;
  const right = width - leftInset;
  const contentWidth = right - left;
  const { measure, textBoundingHeight, fontDescent, fontAscent } = createTextMeasurer();

  const svg = createSvgNode("svg", {
    xmlns: SVG_NS,
    width,
    height: 1,
    viewBox: `0 0 ${width} 1`,
    preserveAspectRatio: "xMinYMin meet",
    class: "image-preview",
    role: "img",
    "aria-label": `Nutrition Facts for ${data.product_name || "product"}`,
    "text-rendering": "geometricPrecision",
  });
  const definitions = createSvgNode("defs", {}, svg);
  const style = createSvgNode("style", {}, definitions);
  style.textContent =
    'text { fill: #000; dominant-baseline: alphabetic; } .nf-regular { font-family: Arial, Helvetica, sans-serif; font-weight: 400; } .nf-bold { font-family: "Arial Black", Arial, Helvetica, sans-serif; font-weight: 900; }';
  createSvgNode("rect", { x: 0, y: 0, width, height: 1, fill: "#fff" }, svg);

  let y = leftInset;
  const drawText = (value, x, top, size, bold = false, anchor = "start", italic = false) => {
    const element = createSvgNode(
      "text",
      {
        x,
        y: top + fontAscent(value, size, bold, italic),
        "font-size": size,
        "text-anchor": anchor,
        class: bold ? "nf-bold" : "nf-regular",
        "font-style": italic ? "italic" : "normal",
      },
      svg,
    );
    element.textContent = String(value);
    return element;
  };
  const drawRule = (thickness, x = left, ruleWidth = contentWidth) => {
    createSvgNode("rect", { x, y, width: ruleWidth, height: thickness, fill: "#000" }, svg);
    y += thickness;
  };
  const drawHairlineGap = (x = left, ruleWidth = contentWidth) => {
    y += pt(POINTS.hairlinePad);
    drawRule(pt(POINTS.ruleHairline), x, ruleWidth);
    y += pt(POINTS.hairlinePad);
  };

  const orderedNutrients = nutrients
    .map((nutrient, index) => ({
      ...nutrient,
      name: nutrient.name.trim(),
      unit: nutrient.unit.trim(),
      value: Number(nutrient.value),
      daily_value_percent:
        nutrient.daily_value_percent == null ? null : Number(nutrient.daily_value_percent),
      _key: normalizeName(nutrient.name),
      _index: index,
    }))
    .sort((a, b) => {
      const aOrder = NUTRIENT_ORDER.indexOf(a._key);
      const bOrder = NUTRIENT_ORDER.indexOf(b._key);
      return (
        (aOrder < 0 ? NUTRIENT_ORDER.length : aOrder) -
          (bOrder < 0 ? NUTRIENT_ORDER.length : bOrder) || a._index - b._index
      );
    });
  const macros = orderedNutrients.filter((nutrient) => !MICRO_NUTRIENTS.has(nutrient._key));
  const micros = orderedNutrients.filter((nutrient) => MICRO_NUTRIENTS.has(nutrient._key));

  // Start the title at the normal inner border inset; the extra 8pt top spacer
  // from the Python draft made the label look unnecessarily empty above the title.
  const minTitle = pt(SPACING_PT.titleMinSize);
  const maxTitle = pt(SPACING_PT.titleMaxSize);
  const titleMaxWidth = Math.max(10, contentWidth - pt(SPACING_PT.titleRightInset));
  let low = minTitle;
  let high = maxTitle;
  let titleSize = minTitle;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (measure("Nutrition Facts", mid, true)[0] <= titleMaxWidth) {
      titleSize = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  drawText("Nutrition Facts", left, y, titleSize, true);
  y +=
    measure("Nutrition Facts", titleSize, true)[1] -
    fontDescent("Nutrition Facts", titleSize, true);
  y += pt(SPACING_PT.afterTitle);

  const servingCountText = Number.isInteger(servingsPerContainer)
    ? String(servingsPerContainer)
    : formatNumber(servingsPerContainer);
  const servingsText = `${servingCountText} ${servingsPerContainer === 1 ? "serving" : "servings"} per container`;
  const servingsSize = pt(POINTS.servings);
  drawText(servingsText, left, y, servingsSize);
  y += measure(servingsText, servingsSize)[1] + pt(POINTS.servingsLeading);

  const servingSize = pt(POINTS.servingSize);
  const servingText = data.serving_info.serving_size.trim();
  const servingRowBaseline = y + fontAscent("Serving size", servingSize, true);
  drawText("Serving size", left, y, servingSize, true);
  drawText(
    servingText,
    right,
    servingRowBaseline - fontAscent(servingText, servingSize),
    servingSize,
    false,
    "end",
  );
  y += measure("Serving size", servingSize, true)[1] + pt(SPACING_PT.servingSizeBottom);
  drawRule(pt(POINTS.ruleHeavy));

  // Calories
  y += pt(SPACING_PT.beforeAmountPerServing);
  const amountSize = pt(POINTS.amount);
  drawText("Amount per serving", left, y, amountSize, true);
  y += textBoundingHeight("Amount per serving", amountSize, true) + pt(SPACING_PT.amountBottom);

  const calorieLabelSize = pt(POINTS.caloriesLabel);
  const calorieValueSize = Math.max(pt(POINTS.caloriesValue), Math.floor(titleSize * 1.08));
  const calorieText = String(calories);
  const calorieLabelHeight = textBoundingHeight("Calories", calorieLabelSize, true);
  const calorieValueHeight = textBoundingHeight(calorieText, calorieValueSize, true);
  const calorieRowHeight = Math.max(calorieLabelHeight, calorieValueHeight);
  drawText("Calories", left, y + calorieRowHeight - calorieLabelHeight, calorieLabelSize, true);
  drawText(
    calorieText,
    right,
    y + calorieRowHeight - calorieValueHeight,
    calorieValueSize,
    true,
    "end",
  );
  y += calorieRowHeight + pt(SPACING_PT.caloriesBottom);
  drawRule(pt(POINTS.ruleMedium));

  // Daily-value header and macronutrients
  y += pt(SPACING_PT.afterCaloriesRule);
  const dailyValueHeaderSize = pt(POINTS.dailyValueHeader);
  drawText("% Daily Value*", right, y, dailyValueHeaderSize, true, "end");
  y += measure("% Daily Value*", dailyValueHeaderSize, true)[1] + pt(SPACING_PT.dailyValueBottom);
  drawHairlineGap();

  const nutrientSize = pt(POINTS.nutrient);
  if (macros.length === 0) y += pt(POINTS.nutrientLeading);
  const nutrientRows = macros.map((nutrient) => {
    const role = ADDED_SUGARS.has(nutrient._key)
      ? "added"
      : SUB_NUTRIENTS.has(nutrient._key)
        ? "sub"
        : MAIN_NUTRIENTS.has(nutrient._key)
          ? "main"
          : "other";

    const value = formatAmount(nutrient);
    const dv = formatDailyValue(nutrient);
    const label =
      role === "added"
        ? `Includes ${value} Added Sugars`
        : DISPLAY_NAMES[nutrient._key] || nutrient.name;
    const indent =
      role === "added" ? pt(POINTS.indentAdded) : role === "sub" ? pt(POINTS.indentSub) : 0;
    const italic = nutrient._key === "trans fat";
    return { nutrient, role, value, dv, label, indent, italic, nameBold: role === "main" };
  });
  nutrientRows.forEach((row, index) => {
    const { nutrient, role, value, dv, label, indent, italic, nameBold } = row;
    if (index > 0) {
      if (role === "added") {
        const ruleX = left + pt(POINTS.indentAdded);
        drawHairlineGap(ruleX, right - ruleX);
      } else drawHairlineGap();
    }

    const x = left + indent;
    const rowBaseline = y + fontAscent(value, nutrientSize);
    drawText(
      label,
      x,
      rowBaseline - fontAscent(label, nutrientSize, nameBold, italic),
      nutrientSize,
      nameBold,
      "start",
      italic,
    );
    const nameHeight = measure(label, nutrientSize, nameBold)[1];
    let valueHeight = 0;
    if (role !== "added") {
      const labelWidth = measure(label, nutrientSize, nameBold, italic)[0];
      const spaceWidth = measure(" ", nutrientSize)[0];
      drawText(
        value,
        x + labelWidth + spaceWidth,
        rowBaseline - fontAscent(value, nutrientSize),
        nutrientSize,
      );
      valueHeight = measure(value, nutrientSize)[1];
    }
    if (dv) {
      drawText(
        dv,
        right,
        rowBaseline - fontAscent(dv, nutrientSize, true),
        nutrientSize,
        true,
        "end",
      );
    }
    y += Math.max(nameHeight, valueHeight, 1);
  });

  y += pt(SPACING_PT.beforeNutrientRule);
  drawRule(pt(POINTS.ruleHeavy));

  // Micronutrients: two columns with a centered bullet, like the Python renderer.
  if (micros.length > 0) {
    y += pt(SPACING_PT.beforeMicronutrients);
    const microSize = pt(POINTS.micro);
    const items = micros.map((nutrient) => {
      const name =
        MICRO_ABBREVIATIONS[nutrient._key] || DISPLAY_NAMES[nutrient._key] || nutrient.name;
      const dv = formatDailyValue(nutrient);
      return `${name} ${formatAmount(nutrient)}${dv ? ` ${dv}` : ""}`;
    });
    const middleX = left + Math.floor(contentWidth / 2);
    for (let index = 0; index < items.length; index += 2) {
      const row = items.slice(index, index + 2);
      drawText(row[0], left, y, microSize);
      if (row.length === 2) {
        drawText(row[1], right, y, microSize, false, "end");
        const bulletWidth = measure("•", microSize, true)[0];
        drawText("•", middleX - Math.floor(bulletWidth / 2), y, microSize, true);
      }
      y += measure("A", microSize)[1];
      if (index < items.length - 2) drawHairlineGap();
    }
    y += pt(SPACING_PT.afterMicronutrients);
  }

  drawRule(pt(POINTS.ruleHeavy));
  y += pt(SPACING_PT.beforeFootnote);

  // Footnote wrapping uses measured text width, not an estimated character count.
  const footnoteSize = pt(POINTS.footnote);
  const footnoteLines = [];
  let currentLine = "";
  for (const word of FOOTNOTE.split(/\s+/)) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && measure(candidate, footnoteSize)[0] > contentWidth) {
      footnoteLines.push(currentLine);
      currentLine = word;
    } else currentLine = candidate;
  }
  if (currentLine) footnoteLines.push(currentLine);
  footnoteLines.forEach((line, index) => {
    drawText(line, left, y, footnoteSize);
    y += measure(line, footnoteSize)[1];
    if (index < footnoteLines.length - 1) y += pt(POINTS.footnoteLeading);
  });
  y += pt(POINTS.inset);

  const borderWidth = Math.max(1, pt(POINTS.box));
  const height = Math.max(y + borderWidth, borderWidth * 2 + 10);
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const framePath =
    `M0 0H${width}V${height}H0Z ` +
    `M${borderWidth} ${borderWidth}V${height - borderWidth}H${width - borderWidth}V${borderWidth}Z`;
  createSvgNode(
    "path",
    {
      d: framePath,
      fill: "#000",
      "fill-rule": "evenodd",
      "pointer-events": "none",
    },
    svg,
  );

  return svg;
}

export default renderNutritionFacts;
