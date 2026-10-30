// Hệ số là số calories trong mỗi gram; đường và chất xơ đã nằm trong carbohydrate.
const CALORIE_FACTORS = new Map([
  ["total fat", 9],
  ["total carbohydrate", 4],
  ["total carbohydrates", 4],
  ["carbohydrates", 4],
  ["protein", 4],
]);

export function calculateCalories(nutrients) {
  let calories = 0;
  let hasEnergyNutrient = false;

  nutrients.forEach((nutrient) => {
    const name = nutrient.name.trim().toLowerCase().replace(/\s+/g, " ");
    const factor = CALORIE_FACTORS.get(name);
    if (factor === undefined || nutrient.value === "" || nutrient.value == null)
      return;

    const amount = Number(nutrient.value);
    if (!Number.isFinite(amount) || amount < 0) return;
    calories += amount * factor;
    hasEnergyNutrient = true;
  });

  return hasEnergyNutrient ? Math.round(calories) : null;
}
