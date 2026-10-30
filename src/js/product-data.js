const nutrientTemplate = [
  {
    name: "Total Fat",
    value: 18,
    unit: "g",
    daily_value_percent: 23,
  },
  { name: "Saturated Fat", value: 1.5, unit: "g", daily_value_percent: 8 },
  { name: "Trans Fat", value: 0, unit: "g", daily_value_percent: null },
  { name: "Cholesterol", value: 0, unit: "mg", daily_value_percent: 0 },
  { name: "Sodium", value: 5, unit: "mg", daily_value_percent: 0 },
  { name: "Total Carbohydrate", value: 6, unit: "g", daily_value_percent: 2 },
  { name: "Dietary Fiber", value: 3, unit: "g", daily_value_percent: 11 },
  { name: "Total Sugars", value: 2, unit: "g", daily_value_percent: null },
  { name: "Added Sugars", value: 0, unit: "g", daily_value_percent: 0 },
  { name: "Protein", value: 7, unit: "g", daily_value_percent: 14 },
  { name: "Vitamin D", value: 0, unit: "mcg", daily_value_percent: 0 },
  { name: "Calcium", value: 55, unit: "mg", daily_value_percent: 4 },
  { name: "Iron", value: 1.2, unit: "mg", daily_value_percent: 6 },
  { name: "Potassium", value: 200, unit: "mg", daily_value_percent: 4 },
];

export function createEmptyProductData() {
  return {
    product_name: "",
    serving_info: {
      serving_size: "",
      serving_weight: "",
      serving_unit: "",
      servings_per_container: "",
    },
    calories: "",
    nutrients: nutrientTemplate.map((nutrient) => ({
      ...nutrient,
      value: "",
      daily_value_percent: null,
    })),
  };
}
