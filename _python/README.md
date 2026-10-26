<!--
Copyright (C) 2026  AnhHuy13

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://gnu.org>.
-->
# Nutritionfacts Label Gen

Thư viện để tạo hình Nutrtion facts gần giống tiêu chuẩn của FDA (Mỹ)

## Tải về

```bash
pip install -r requirements.txt
pip install -e .
```

## Khởi tạo

```python
from nutrition_facts import NutritionFactsGenerator
from nutrition_facts.models import NutritionData, ServingInfo, Nutrient

data = NutritionData(
    product_name="Almond Butter",
    serving_info=ServingInfo(
        serving_size="2 tbsp (32g)",
        servings_per_container=14,
    ),
    calories=190,
    nutrients=[
        Nutrient(name="Total Fat", value=18, unit="g", daily_value_percent=23),
        Nutrient(name="Saturated Fat", value=1.5, unit="g", daily_value_percent=8),
        Nutrient(name="Carbohydrates", value=6, unit="g", daily_value_percent=2),
        Nutrient(name="Protein", value=7, unit="g", daily_value_percent=14),
    ],
)

generator = NutritionFactsGenerator()
path = generator.generate(data, "output.png")
print(path)
```

Chạy thử:

```bash
python examples/basic_example.py
```

## API

### `NutritionData`

| trường         | kiểu dữ liệu     | ghi chú                     |
| -------------- | ---------------- | --------------------------- |
| `product_name` | `str`            | bắt buộc                    |
| `serving_info` | `ServingInfo`    | serving size & serving cont |
| `calories`     | `int`            | >= 0                        |
| `nutrients`    | `list[Nutrient]` | để trống ko sao             |
| `manufacturer` | `str` or `None`  | Optional footer line        |

### `NutritionFactsGenerator(width=600, height=800, dpi=300)`

`generate(data, output_path)` sẽ kiểm lại dữ liệu trước và tạo hình Nutrition facts label. Path file phải kết thúc bằng .png, .jpg hoặc .jpeg.

## Tests

```bash
pytest
```
