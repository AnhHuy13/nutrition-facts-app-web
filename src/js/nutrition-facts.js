/*
 * Copyright (C) 2026 AnhHuy13
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * SVG port of _python/nutrition_facts/generator.py.
 * renderNutritionFacts(data) returns an SVGElement; append it to the document.
 */
(function (root) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const DEFAULT_WIDTH = 675;
  const SCALE = DEFAULT_WIDTH / (2.25 * 72);
  const C = {
    box: 0.5,
    inset: 3,
    heavy: 7,
    medium: 3,
    hairline: 0.25,
    hairlinePad: 2,
    servings: 10,
    servingsLeading: 1,
    servingSize: 10,
    amount: 6,
    caloriesLabel: 16,
    caloriesValue: 22,
    dvHeader: 6,
    nutrient: 8,
    nutrientLeading: 4,
    footnote: 6,
    footnoteLeading: 1,
    micro: 8,
    microLeading: 4,
    indentSub: 8,
    indentAdded: 16,
  };
  const FOOTNOTE =
    "* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.";
  const ORDER = [
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
  const MAIN = new Set([
    "total fat",
    "cholesterol",
    "sodium",
    "total carbohydrate",
    "total carbohydrates",
    "carbohydrates",
    "protein",
  ]);
  const SUB = new Set(["saturated fat", "trans fat", "dietary fiber", "total sugars", "sugars"]);
  const MICRO = new Set([
    "vitamin d",
    "vit. d",
    "vit d",
    "calcium",
    "iron",
    "potassium",
    "potas.",
    "potas",
  ]);
  const ADDED = new Set(["added sugars", "includes added sugars"]);
  const DISPLAY = {
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
  const MICRO_DISPLAY = {
    "vitamin d": "Vit. D",
    "vit. d": "Vit. D",
    "vit d": "Vit. D",
    potassium: "Potas.",
    "potas.": "Potas.",
    potas: "Potas.",
  };
  const px = (pt) => (pt <= 0 ? 0 : Math.max(1, Math.round(pt * SCALE)));
  const key = (name) => String(name).trim().toLowerCase().replace(/\s+/g, " ");
  const trimNumber = (n) => {
    const value = Number(n);
    if (Number.isInteger(value)) return String(value);
    return value.toPrecision(6).replace(/(?:\.0+|(?:(\.\d*?)0+))(e|$)/, "$1$2");
  };
  const nutrientValue = (n) => `${trimNumber(n.value)}${n.unit}`;
  const dailyValue = (n) =>
    n.daily_value_percent == null ? "" : `${trimNumber(n.daily_value_percent)}%`;
  const make = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attrs || {})) el.setAttribute(name, String(value));
    if (parent) parent.appendChild(el);
    return el;
  };

  function renderNutritionFacts(data, options = {}) {
    if (!data || !data.serving_info || !Array.isArray(data.nutrients)) {
      throw new TypeError("Expected data with serving_info and a nutrients array.");
    }
    const width = Math.max(200, Math.round(Number(options.width) || DEFAULT_WIDTH));
    const p = (value) => Math.max(1, Math.round(value * (width / DEFAULT_WIDTH)));
    const heightMetric = (ctx, value, size, bold = false) => {
      setFont(ctx, size, bold);
      const m = ctx.measureText(value || "A");
      return Math.max(
        1,
        Math.round(
          (m.fontBoundingBoxAscent || size * 0.8) + (m.fontBoundingBoxDescent || size * 0.2),
        ),
      );
    };
    const ctxCanvas = document.createElement("canvas");
    const ctx = ctxCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas text metrics are unavailable in this environment.");

    const svg = make("svg", {
      xmlns: NS,
      width,
      height: 1,
      viewBox: `0 0 ${width} 1`,
      role: "img",
      "aria-label": `Nutrition Facts for ${data.product_name || "product"}`,
      "text-rendering": "geometricPrecision",
    });
    const defs = make("defs", {}, svg);
    const style = make("style", {}, defs);
    style.textContent =
      'text { fill:#000; dominant-baseline:hanging; } .nf-regular { font-family:Arial,Helvetica,sans-serif; font-weight:400; } .nf-bold { font-family:"Arial Black",Arial,Helvetica,sans-serif; font-weight:900; }';
    make("rect", { x: 0, y: 0, width, height: 1, fill: "#fff" }, svg);

    let y = p(px(C.box) + px(C.inset));
    const left = p(px(C.box) + px(C.inset));
    const right = width - left;
    const contentWidth = right - left;
    const pt = (points) => p(px(points));
    const setFont = (context, size, bold) => {
      context.font = `${bold ? "900" : "400"} ${size}px ${bold ? '"Arial Black", Arial, sans-serif' : "Arial, sans-serif"}`;
    };
    const measure = (value, size, bold = false) => {
      setFont(ctx, size, bold);
      const m = ctx.measureText(value);
      return [
        Math.round(m.width),
        Math.max(
          1,
          Math.round(
            (m.fontBoundingBoxAscent || size * 0.8) + (m.fontBoundingBoxDescent || size * 0.2),
          ),
        ),
      ];
    };
    const addText = (value, x, top, size, bold = false, anchor = "start") => {
      const el = make(
        "text",
        {
          x,
          y: top,
          "font-size": size,
          "text-anchor": anchor,
          class: bold ? "nf-bold" : "nf-regular",
        },
        svg,
      );
      el.textContent = String(value);
      return el;
    };
    const addRule = (thickness, x = left, w = contentWidth) => {
      make("rect", { x, y, width: w, height: thickness, fill: "#000" }, svg);
      y += thickness;
    };
    const hairline = (x = left, w = contentWidth) => {
      y += pt(C.hairlinePad);
      addRule(pt(C.hairline), x, w);
      y += pt(C.hairlinePad);
    };
    const sorted = data.nutrients.map((item, index) => ({
      ...item,
      _key: key(item.name),
      _index: index,
    }));
    sorted.sort((a, b) => {
      const ai = ORDER.indexOf(a._key),
        bi = ORDER.indexOf(b._key);
      return (ai < 0 ? ORDER.length : ai) - (bi < 0 ? ORDER.length : bi) || a._index - b._index;
    });
    const macros = sorted.filter((n) => !MICRO.has(n._key));
    const micros = sorted.filter((n) => MICRO.has(n._key));

    // Header: same cursor changes and font-size fitting as Python's _draw_header.
    y += pt(8);
    const minTitle = pt(18),
      maxTitle = pt(36),
      maxTitleWidth = Math.max(10, contentWidth - pt(1));
    let lo = minTitle,
      hi = maxTitle,
      titleSize = minTitle;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (measure("Nutrition Facts", mid, true)[0] <= maxTitleWidth) {
        titleSize = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    addText("Nutrition Facts", left, y, titleSize, true);
    const titleMetrics = measure("Nutrition Facts", titleSize, true);
    setFont(ctx, titleSize, true);
    const titleDescent = Math.round(
      ctx.measureText("Nutrition Facts").fontBoundingBoxDescent || titleSize * 0.2,
    );
    y += titleMetrics[1] - titleDescent; // Python: title_h - descent - _pt(-3)

    const servingCount = Number(data.serving_info.servings_per_container);
    const servings = `${trimNumber(servingCount)} ${servingCount === 1 ? "serving" : "servings"} per container`;
    const servingsSize = pt(C.servings);
    addText(servings, left, y, servingsSize);
    y += measure(servings, servingsSize)[1] + pt(C.servingsLeading);
    const servingSize = pt(C.servingSize);
    addText("Serving size", left, y, servingSize, true);
    addText(data.serving_info.serving_size, right, y, servingSize, false, "end");
    y += measure("Serving size", servingSize, true)[1] + pt(2);
    addRule(pt(C.heavy));

    // Calories block mirrors _draw_calories, including Pillow text bounding-box heights.
    y += pt(3);
    const amountSize = pt(C.amount);
    addText("Amount per serving", left, y, amountSize, true);
    y += heightMetric(ctx, "Amount per serving", amountSize, true) + pt(1);
    const calLabelSize = pt(C.caloriesLabel);
    const calValueSize = Math.max(pt(C.caloriesValue), Math.floor(titleSize * 1.08));
    const calText = String(data.calories ?? 0);
    const labelHeight = heightMetric(ctx, "Calories", calLabelSize, true);
    const valueHeight = heightMetric(ctx, calText, calValueSize, true);
    const rowHeight = Math.max(labelHeight, valueHeight);
    addText("Calories", left, y + rowHeight - labelHeight, calLabelSize, true);
    addText(calText, right, y + rowHeight - valueHeight, calValueSize, true, "end");
    y += rowHeight + pt(4);
    addRule(pt(C.medium));

    y += pt(4);
    const dvSize = pt(C.dvHeader);
    addText("% Daily Value*", right, y, dvSize, true, "end");
    y += measure("% Daily Value*", dvSize, true)[1] + pt(1);
    hairline();

    const nutrientSize = pt(C.nutrient);
    if (!macros.length) y += pt(C.nutrientLeading);
    macros.forEach((n, index) => {
      const role = ADDED.has(n._key)
        ? "added"
        : SUB.has(n._key)
          ? "sub"
          : MAIN.has(n._key)
            ? "main"
            : "other";
      if (index > 0) {
        if (role === "added") {
          const ruleX = left + pt(C.indentAdded);
          hairline(ruleX, right - ruleX);
        } else hairline();
      }
      const value = nutrientValue(n);
      const dv = dailyValue(n);
      const label = role === "added" ? `Includes ${value} Added Sugars` : DISPLAY[n._key] || n.name;
      const indent = role === "added" ? pt(C.indentAdded) : role === "sub" ? pt(C.indentSub) : 0;
      const nameBold = role === "main";
      const x = left + indent;
      addText(label, x, y, nutrientSize, nameBold);
      const nameWidth = measure(label, nutrientSize, nameBold)[0];
      let valueHeight = 0;
      if (role !== "added") {
        const gap = measure(" ", nutrientSize)[0];
        addText(value, x + nameWidth + gap, y, nutrientSize);
        valueHeight = measure(value, nutrientSize)[1];
      }
      const nameHeight = measure(label, nutrientSize, nameBold)[1];
      if (dv) addText(dv, right, y, nutrientSize, true, "end");
      y += Math.max(nameHeight, valueHeight, 1);
    });

    y += pt(2);
    addRule(pt(C.heavy));
    if (micros.length) {
      y += pt(2);
      const microSize = pt(C.micro);
      const items = micros.map((n) => {
        const name = MICRO_DISPLAY[n._key] || DISPLAY[n._key] || n.name;
        return `${name} ${nutrientValue(n)}${dailyValue(n) ? ` ${dailyValue(n)}` : ""}`;
      });
      const mid = left + Math.floor(contentWidth / 2);
      for (let i = 0; i < items.length; i += 2) {
        const row = items.slice(i, i + 2);
        addText(row[0], left, y, microSize);
        if (row.length === 2) {
          addText(row[1], right, y, microSize, false, "end");
          const bulletWidth = measure("•", microSize, true)[0];
          addText("•", mid - Math.floor(bulletWidth / 2), y, microSize, true);
        }
        y += measure("A", microSize)[1];
        if (i < items.length - 2) hairline();
      }
      y += pt(2);
    }
    addRule(pt(C.heavy));
    y += pt(2);

    const footSize = pt(C.footnote);
    const lines = [];
    let line = "";
    for (const word of FOOTNOTE.split(/\s+/)) {
      const trial = line ? `${line} ${word}` : word;
      if (line && measure(trial, footSize)[0] > contentWidth) {
        lines.push(line);
        line = word;
      } else line = trial;
    }
    if (line) lines.push(line);
    lines.forEach((footLine, index) => {
      addText(footLine, left, y, footSize);
      y += measure(footLine, footSize)[1];
      if (index < lines.length - 1) y += pt(C.footnoteLeading);
    });
    y += pt(C.inset);

    const box = Math.max(1, pt(C.box));
    const height = Math.max(y + box, box * 2 + 10);
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    // Pillow's border is an inward, 2px black frame (DEFAULT_WIDTH at 300 DPI).
    const borderPath = `M0 0H${width}V${height}H0Z M${box} ${box}V${height - box}H${width - box}V${box}Z`;
    make(
      "path",
      { d: borderPath, fill: "#000", "fill-rule": "evenodd", "pointer-events": "none" },
      svg,
    );
    return svg;
  }

  root.renderNutritionFacts = renderNutritionFacts;
  if (typeof module !== "undefined" && module.exports) module.exports = { renderNutritionFacts };
})(typeof globalThis !== "undefined" ? globalThis : window);
