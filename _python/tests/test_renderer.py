#
# Copyright (C) 2026  AnhHuy13
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://gnu.org>.
#
from PIL import Image

from nutrition_facts.constants import RGB_WHITE
from nutrition_facts.renderer import (
    draw_border,
    draw_horizontal_line,
    draw_nutrient_row,
    draw_text,
    measure_text,
)
from nutrition_facts.utils import format_daily_value, format_nutrient_value, sort_nutrients
from nutrition_facts.models import Nutrient


def _blank() -> Image.Image:
    return Image.new("RGB", (200, 120), RGB_WHITE)


def test_draw_text_changes_pixels():
    img = _blank()
    draw_text(img, (10, 10), "Hello", 16, bold=True)
    assert any(img.getpixel((x, y)) != RGB_WHITE for x in range(img.width) for y in range(img.height))


def test_draw_horizontal_line():
    img = _blank()
    draw_horizontal_line(img, y=40, width=100, thickness=3, x=10)
    assert img.getpixel((20, 41)) == (0, 0, 0)


def test_draw_border():
    img = _blank()
    draw_border(img, thickness=2)
    assert img.getpixel((0, 0)) == (0, 0, 0)
    assert img.getpixel((100, 60)) == RGB_WHITE


def test_draw_nutrient_row():
    img = Image.new("RGB", (400, 80), RGB_WHITE)
    draw_nutrient_row(img, y=20, label="Protein", value="7g", daily_value="14%")
    assert any(
        img.getpixel((x, y)) != RGB_WHITE
        for x in range(0, img.width, 4)
        for y in range(0, img.height, 4)
    )


def test_measure_text():
    width, height = measure_text("Calories", 14, bold=True)
    assert width > 0
    assert height > 0


def test_format_helpers():
    assert format_nutrient_value(18.0, "g") == "18g"
    assert format_nutrient_value(1.5, "g") == "1.5g"
    assert format_daily_value(23) == "23%"
    assert format_daily_value(None) is None
    from nutrition_facts.utils import format_servings

    assert format_servings(14) == "14 servings per container"
    assert format_servings(1) == "1 serving per container"


def test_sort_nutrients_uses_standard_order():
    nutrients = [
        Nutrient(name="Protein", value=7, unit="g"),
        Nutrient(name="Total Fat", value=18, unit="g"),
        Nutrient(name="Custom Mineral", value=1, unit="mg"),
    ]
    ordered = sort_nutrients(nutrients)
    assert [n.name for n in ordered] == ["Total Fat", "Protein", "Custom Mineral"]


def test_nutrient_roles():
    from nutrition_facts.utils import nutrient_role

    assert nutrient_role("Total Fat") == "main"
    assert nutrient_role("Saturated Fat") == "sub"
    assert nutrient_role("Added Sugars") == "added"
    assert nutrient_role("Vitamin D") == "micro"


def test_needs_full_hairline_before_fda_rules():
    from nutrition_facts.utils import needs_full_hairline_before

    # Fat group: no hairlines between Total Fat / Saturated Fat / Trans Fat
    assert needs_full_hairline_before("Total Fat", "Saturated Fat") is False
    assert needs_full_hairline_before("Saturated Fat", "Trans Fat") is False
    assert needs_full_hairline_before("Total Fat", "Trans Fat") is False

    # Trans Fat -> next main nutrient (Cholesterol) needs hairline
    assert needs_full_hairline_before("Trans Fat", "Cholesterol") is True

    # Main -> main needs hairlines
    assert needs_full_hairline_before("Cholesterol", "Sodium") is True
    assert needs_full_hairline_before("Sodium", "Total Carbohydrate") is True

    # Carb parent -> first sub (Dietary Fiber): no hairline
    assert needs_full_hairline_before("Total Carbohydrate", "Dietary Fiber") is False
    assert needs_full_hairline_before("Carbohydrates", "Dietary Fiber") is False

    # Dietary Fiber -> Total Sugars (sibling carb subs): needs hairline
    assert needs_full_hairline_before("Dietary Fiber", "Total Sugars") is True

    # Before Protein (final main): NO hairline, regardless of predecessor
    assert needs_full_hairline_before("Added Sugars", "Protein") is False
    assert needs_full_hairline_before("Total Sugars", "Protein") is False
    assert needs_full_hairline_before("Sodium", "Protein") is False

    # Typical valid transition (Added Sugars is role="added" handled separately)
    assert needs_full_hairline_before("Total Sugars", "Added Sugars") is True
