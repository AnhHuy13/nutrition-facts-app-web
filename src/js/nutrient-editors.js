function makeNumberInput({ value, label }) {
  const input = document.createElement("input");
  input.type = "number";
  input.className = "form-control number-input";
  input.min = "0";
  input.step = "any";
  input.value = value == null ? "" : String(value);
  input.setAttribute("aria-label", label);
  return input;
}

function makeNutrientField(nutrient, index) {
  const field = document.createElement("label");
  field.className = "nutrient-row";
  const caption = document.createElement("span");
  caption.className = "nutrient-caption";
  caption.textContent = `${nutrient.name} (${nutrient.unit})`;
  const input = makeNumberInput({
    value: nutrient.value,
    label: `${nutrient.name} amount (${nutrient.unit})`,
  });
  input.dataset.nutrientIndex = String(index);
  input.dataset.nutrientProperty = "value";
  field.append(caption, input);
  return field;
}

export function createNutrientEditors(data, macroFields, microFields) {
  macroFields.replaceChildren();
  microFields.replaceChildren();
  const macroColumns = [0, 1].map(() => {
    const column = document.createElement("div");
    column.className = "nutrient-column";
    macroFields.append(column);
    return column;
  });
  const macros = [];
  data.nutrients.forEach((nutrient, index) => {
    const isMicro = ["vitamin d", "vit. d", "vit d", "calcium", "iron", "potassium"].includes(
      nutrient.name.trim().toLowerCase(),
    );
    if (isMicro) microFields.append(makeNutrientField(nutrient, index));
    else macros.push({ nutrient, index });
  });
  const splitAt = Math.ceil(macros.length / 2);
  macros.forEach((item, index) => {
    macroColumns[index < splitAt ? 0 : 1].append(makeNutrientField(item.nutrient, item.index));
  });
}
