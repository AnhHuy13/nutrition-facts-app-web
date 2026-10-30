const MICRO_NUTRIENTS = new Set([
  "vitamin d",
  "vit. d",
  "vit d",
  "calcium",
  "iron",
  "potassium",
]);

function NutrientInput({ nutrient, index, onChange }) {
  return (
    <label className="nutrient-row">
      <span className="nutrient-caption">
        {nutrient.name} ({nutrient.unit})
      </span>
      <input
        className="form-control number-input"
        type="number"
        min="0"
        step="any"
        aria-label={`${nutrient.name} amount (${nutrient.unit})`}
        value={nutrient.value}
        onChange={(event) => onChange(index, event.target.value)}
      />
    </label>
  );
}

export function NutrientFields({ nutrients, onChange, micros = false }) {
  // Lọc chất cần hiển thị; giữ chỉ số gốc để cập nhật đúng dữ liệu.
  const macros = nutrients
    .map((nutrient, index) => ({ nutrient, index }))
    .filter(({ nutrient }) => {
      const name = nutrient.name.trim().toLowerCase();
      const isMicroNutrient = MICRO_NUTRIENTS.has(name);

      if (micros) {
        return isMicroNutrient;
      }

      return !isMicroNutrient;
    });
  const middle = Math.ceil(macros.length / 2);

  if (micros) {
    // Vi chất hiển thị thành một danh sách.
    return (
      <div className="micronutrient-fields">
        {macros.map(({ nutrient, index }) => (
          <NutrientInput
            key={nutrient.name}
            nutrient={nutrient}
            index={index}
            onChange={onChange}
          />
        ))}
      </div>
    );
  }

  // Chất đa lượng chia thành hai cột.
  return (
    <div className="nutrient-columns" aria-label="Chất đa lượng">
      {[macros.slice(0, middle), macros.slice(middle)].map(
        (column, columnIndex) => (
          <div className="nutrient-column" key={columnIndex}>
            {column.map(({ nutrient, index }) => (
              <NutrientInput
                key={nutrient.name}
                nutrient={nutrient}
                index={index}
                onChange={onChange}
              />
            ))}
          </div>
        ),
      )}
    </div>
  );
}

export default function ProductEditor({
  data,
  automaticCalories,
  onAutomaticCaloriesChange,
  onBasicChange,
  onNutrientChange,
}) {
  const weight = data.serving_info.serving_weight;

  return (
    <section
      className="product-editor"
      aria-label="Thông tin sản phẩm và chất đa lượng"
    >
      <div className="product-basics">
        <label className="form-field product-name-field">
          <span>Tên sản phẩm</span>
          <input
            className="form-control"
            type="text"
            placeholder="Nhập tên sản phẩm"
            value={data.product_name}
            onChange={(event) =>
              onBasicChange("product_name", event.target.value)
            }
          />
        </label>
        <label className="form-field serving-weight-field">
          <span>Trọng lượng 1 serving</span>
          <span className="unit-input">
            <input
              className="form-control"
              type="number"
              min="0"
              step="1"
              value={weight}
              onChange={(event) =>
                onBasicChange("serving_weight", event.target.value)
              }
            />
            <span className="unit-suffix">g</span>
          </span>
        </label>
        <label className="form-field servings-field">
          <span>Số lượng serving</span>
          <input
            className="form-control"
            type="number"
            min="0"
            step="1"
            value={data.serving_info.servings_per_container}
            onChange={(event) =>
              onBasicChange("servings_per_container", event.target.value)
            }
          />
        </label>
        <div className="form-field calories-field">
          <span className="calories-heading">
            <label htmlFor="calories-input">Calories</label>
            <span className="auto-calories-toggle">
              <input
                id="auto-calories"
                type="checkbox"
                checked={automaticCalories}
                onChange={(event) =>
                  onAutomaticCaloriesChange(event.target.checked)
                }
              />
              <label htmlFor="auto-calories">Tự động</label>
            </span>
          </span>
          <input
            id="calories-input"
            className="form-control"
            type="number"
            min="0"
            step="1"
            value={data.calories}
            disabled={automaticCalories}
            onChange={(event) => onBasicChange("calories", event.target.value)}
          />
        </div>
        <label className="form-field serving-unit-field">
          <span>
            Đơn vị khẩu phần{" "}
            <span className="optional-note">(không bắt buộc)</span>
          </span>
          <input
            className="form-control"
            type="text"
            placeholder="Ví dụ: 2 cái, 1 gói"
            value={data.serving_info.serving_unit}
            onChange={(event) =>
              onBasicChange("serving_unit", event.target.value)
            }
          />
        </label>
      </div>
      <NutrientFields nutrients={data.nutrients} onChange={onNutrientChange} />
    </section>
  );
}
