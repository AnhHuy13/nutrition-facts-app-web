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
# NutritionFacts Python Library - Specification for AI Implementation

## 🎯 Objective
Build a minimal viable product (MVP) Python library that generates professional Nutrition Facts label images from structured data.

## 📋 Requirements

### Core Functionality
1. **Input**: Accept nutrition data as Python objects/dictionaries
2. **Processing**: Validate and format the data
3. **Output**: Generate PNG/JPG image of a nutrition facts label (US FDA standard format)

### Key Features
- Create standard US Nutrition Facts labels
- Support customization of product info
- Simple, developer-friendly API
- Proper error handling and validation

---

## 📁 Project Structure

```
nutrition-facts-library/
├── nutrition_facts/
│   ├── __init__.py              # Export main classes
│   ├── models.py                # Pydantic models for data validation
│   ├── generator.py             # Main NutritionFactsGenerator class
│   ├── renderer.py              # Rendering logic (PIL/reportlab)
│   ├── constants.py             # Colors, dimensions, fonts
│   └── utils.py                 # Helper functions
├── examples/
│   └── basic_example.py         # Simple usage example
├── tests/
│   ├── test_models.py
│   ├── test_generator.py
│   └── test_renderer.py
├── templates/
│   └── fonts/                   # TrueType font files (optional)
├── setup.py
├── requirements.txt
└── README.md
```

---

## 📦 Dependencies

**Must-Have:**
- `Pillow>=9.0.0` - Image manipulation
- `pydantic>=1.9.0` - Data validation
- `reportlab>=3.6.0` - PDF/graphics generation (alternative to pure Pillow if needed)

**Dev (Optional):**
- `pytest>=7.0.0` - Testing

---

## 🏗️ Data Models (`models.py`)

### Required Classes

#### `Nutrient`
```
Fields:
  - name: str (e.g., "Total Fat", "Protein")
  - value: float (amount of nutrient)
  - unit: str (e.g., "g", "mg", "μg")
  - daily_value_percent: Optional[float] (e.g., 23 for 23%)
```

#### `ServingInfo`
```
Fields:
  - serving_size: str (e.g., "2 tbsp (32g)")
  - servings_per_container: float
```

#### `NutritionData`
```
Fields:
  - product_name: str
  - serving_info: ServingInfo
  - calories: int
  - nutrients: List[Nutrient]
  - manufacturer: Optional[str]
```

Use Pydantic BaseModel for all. Include field validation.

---

## 🎨 Core Generator Class (`generator.py`)

### `NutritionFactsGenerator`

#### Constructor
```python
__init__(self, width: int = 600, height: int = 800, dpi: int = 300)
```
- Default dimensions for label image
- Configurable DPI for output quality

#### Main Method
```python
def generate(self, data: NutritionData, output_path: str) -> str
```
- Input: NutritionData object and output file path
- Output: Path to generated image file
- Logic:
  1. Validate input data
  2. Create blank image
  3. Render all sections
  4. Save to output_path
  5. Return file path

#### Helper Methods (Private)
```python
def _validate_data(self, data: NutritionData) -> None
def _create_blank_image(self) -> Image
def _draw_header(self, img: Image, data: NutritionData) -> None
def _draw_calories(self, img: Image, calories: int) -> None
def _draw_nutrient_table(self, img: Image, nutrients: List[Nutrient]) -> None
def _draw_footer(self, img: Image, data: NutritionData) -> None
def _save_image(self, img: Image, output_path: str) -> str
```

---

## 🖼️ Renderer Logic (`renderer.py`)

### Responsibilities
- Handle Pillow/PIL operations for drawing
- Manage colors, fonts, text positioning
- Draw rectangles, lines, text at correct positions

### Key Functions
```python
def draw_text(img: Image, position: tuple, text: str, font_size: int, bold: bool = False, color: str = "#000000") -> None

def draw_horizontal_line(img: Image, y: int, width: int, thickness: int = 1, color: str = "#000000") -> None

def draw_nutrient_row(img: Image, y: int, label: str, value: str, daily_value: Optional[str] = None) -> None
```

### Design Specifications
- Label width: 210mm (~600px at 72 DPI)
- Label height: 280mm (~800px at 72 DPI)
- Border: 1px solid black
- Main font: Arial (or system default sans-serif)
- Header font size: 22pt bold
- Nutrient label: 12pt regular
- Nutrient value: 12pt bold
- Colors: Black (#000000) text on white background

---

## 📝 Constants (`constants.py`)

Define:
- Label dimensions (width, height in pixels)
- Color scheme (black, white, borders)
- Font sizes and names
- Padding/margins for different sections
- Standard nutrient names and order

---

## 💻 Example Usage (`examples/basic_example.py`)

```python
from nutrition_facts import NutritionFactsGenerator
from nutrition_facts.models import NutritionData, ServingInfo, Nutrient

# Create data
data = NutritionData(
    product_name="Almond Butter",
    serving_info=ServingInfo(
        serving_size="2 tbsp (32g)",
        servings_per_container=14
    ),
    calories=190,
    nutrients=[
        Nutrient(name="Total Fat", value=18, unit="g", daily_value_percent=23),
        Nutrient(name="Saturated Fat", value=1.5, unit="g", daily_value_percent=8),
        Nutrient(name="Carbohydrates", value=6, unit="g", daily_value_percent=2),
        Nutrient(name="Protein", value=7, unit="g", daily_value_percent=14),
    ]
)

# Generate
generator = NutritionFactsGenerator()
output = generator.generate(data, "output.png")
print(f"Generated: {output}")
```

---

## ✅ Testing Requirements

### Test Cases Needed
1. **Models**: Validate Nutrient, ServingInfo, NutritionData with valid and invalid inputs
2. **Generator**: Test generate() with valid data, missing fields, invalid inputs
3. **Renderer**: Test text rendering, line drawing, proper positioning
4. **Edge Cases**: Empty nutrients list, very long product names, missing optional fields

Use pytest. Aim for >80% coverage.

---

## 📄 Setup Files

### `setup.py`
```python
from setuptools import setup, find_packages

setup(
    name="nutrition-facts",
    version="0.1.0",
    description="Generate nutrition facts label images",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "Pillow>=9.0.0",
        "pydantic>=1.9.0",
        "reportlab>=3.6.0",
    ],
)
```

### `requirements.txt`
```
Pillow>=9.0.0
pydantic>=1.9.0
reportlab>=3.6.0
pytest>=7.0.0
```

### `__init__.py` (package root)
```python
from nutrition_facts.generator import NutritionFactsGenerator
from nutrition_facts.models import NutritionData, ServingInfo, Nutrient

__version__ = "0.1.0"
__all__ = ["NutritionFactsGenerator", "NutritionData", "ServingInfo", "Nutrient"]
```

---

## 🎨 Label Layout Specification

The generated image should follow this layout (top to bottom):

```
┌─────────────────────────────────┐
│   NUTRITION FACTS               │  (Header, bold)
│   Serving Size: 2 tbsp (32g)   │
├─────────────────────────────────┤
│   Servings per Container: 14    │
├─────────────────────────────────┤
│   Calories: 190                 │  (Large, bold)
├─────────────────────────────────┤
│   AMOUNT PER SERVING            │
│   Total Fat 18g          23%     │
│   Saturated Fat 1.5g      8%     │
│   Carbohydrates 6g        2%     │
│   Protein 7g             14%     │
├─────────────────────────────────┤
│   Manufacturer: [optional]      │
└─────────────────────────────────┘
```

---

## 🚀 Implementation Steps

1. **Create data models** (models.py) with validation
2. **Set up generator class** (generator.py) with main structure
3. **Implement renderer** (renderer.py) with Pillow drawing logic
4. **Create constants** (constants.py) with styling
5. **Write example** (examples/basic_example.py)
6. **Add tests** (tests/)
7. **Create README.md** with usage instructions

---

## 🎯 MVP Definition (Minimal Viable)

**Must have for v0.1:**
- ✅ Accept NutritionData input
- ✅ Validate data with Pydantic
- ✅ Generate PNG image with nutrition label
- ✅ Display: product name, serving size, calories, nutrients with daily value %
- ✅ Simple, clean layout
- ✅ Basic error handling

**Nice-to-have for future:**
- Custom colors/styling
- PDF export
- Multiple label templates
- Batch generation
- Web API

---

## 📊 Output Quality

- Resolution: 300 DPI for print quality
- Format: PNG (lossless)
- Size: ~600x800px
- Style: Professional, FDA-compliant appearance
- Font: Clear, readable sans-serif
- No external dependencies for rendering (use Pillow)

---

## ❌ Constraints

- **No**: Complex UI frameworks, web servers, databases for MVP
- **No**: Loading external images/complex graphics
- **No**: Advanced PDF features
- **Yes**: Simple PIL-based rendering
- **Yes**: Minimal, focused feature set

---

## 📝 File Creation Checklist

- [ ] nutrition_facts/__init__.py
- [ ] nutrition_facts/models.py
- [ ] nutrition_facts/generator.py
- [ ] nutrition_facts/renderer.py
- [ ] nutrition_facts/constants.py
- [ ] nutrition_facts/utils.py
- [ ] examples/basic_example.py
- [ ] tests/test_models.py
- [ ] tests/test_generator.py
- [ ] setup.py
- [ ] requirements.txt
- [ ] README.md
- [ ] .gitignore

---

## 🔗 References

- US FDA Nutrition Facts Label Format: https://www.fda.gov/food/labeling-nutrition/nutrition-facts-label
- Pillow Documentation: https://pillow.readthedocs.io/
- Pydantic Documentation: https://docs.pydantic.dev/

---

## 📌 Notes for AI

- Keep code simple and readable for MVP
- Use type hints throughout
- Add docstrings to all public methods
- Focus on core functionality, not edge cases
- Make it easy to extend later
- No premature optimization
