// FDA Daily Values for the standard Nutrition Facts label.
const DAILY_VALUES = new Map([
  ["total fat", 78],
  ["saturated fat", 20],
  ["cholesterol", 300],
  ["sodium", 2300],
  ["total carbohydrate", 275],
  ["total carbohydrates", 275],
  ["carbohydrates", 275],
  ["dietary fiber", 28],
  ["added sugars", 50],
  ["includes added sugars", 50],
  ["protein", 50],
  ["vitamin d", 20],
  ["vit. d", 20],
  ["vit d", 20],
  ["calcium", 1300],
  ["iron", 18],
  ["potassium", 4700],
]);

export function syncDailyValuePercent(nutrient) {
  const key = nutrient.name.trim().toLowerCase().replace(/\s+/g, " ");
  const dailyValue = DAILY_VALUES.get(key);
  const amount = nutrient.value === "" ? NaN : Number(nutrient.value);

  nutrient.daily_value_percent =
    dailyValue && Number.isFinite(amount) && amount >= 0
      ? Math.round((amount / dailyValue) * 100)
      : null;
}
