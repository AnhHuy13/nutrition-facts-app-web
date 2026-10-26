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
"""FDA Nutrition Facts label constants (2016 / 21 CFR 101.9 type specs)."""

from typing import Dict, FrozenSet, List, Tuple

# Default output: ~2.25 in wide standard vertical label at 300 DPI
DEFAULT_DPI = 300
DEFAULT_WIDTH = 675  # 2.25 in * 300
DEFAULT_HEIGHT = 1200

# Physical width the pixel canvas represents (standard vertical format)
LABEL_WIDTH_INCHES = 2.25
POINTS_PER_INCH = 72.0

COLOR_BLACK = "#000000"
COLOR_WHITE = "#FFFFFF"
RGB_BLACK: Tuple[int, int, int] = (0, 0, 0)
RGB_WHITE: Tuple[int, int, int] = (255, 255, 255)

# Box: 1/2 pt rule within 3 pt of text measure
FDA_BOX_PT = 0.5
FDA_INSET_PT = 3.0

# Horizontal rules
FDA_RULE_HEAVY_PT = 7.0
FDA_RULE_MEDIUM_PT = 3.0
FDA_RULE_HAIRLINE_PT = 0.25
FDA_HAIRLINE_PAD_PT = 2.0

# Type sizes (minimums from FDA callouts)
FDA_SERVINGS_PT = 10.0
FDA_SERVINGS_LEADING_PT = 1.0
FDA_SERVING_SIZE_PT = 10.0
FDA_AMOUNT_PT = 6.0
FDA_CALORIES_LABEL_PT = 16.0
FDA_CALORIES_VALUE_PT = 22.0
FDA_DV_HEADER_PT = 6.0
FDA_NUTRIENT_PT = 8.0
FDA_NUTRIENT_LEADING_PT = 4.0
FDA_FOOTNOTE_PT = 6.0
FDA_FOOTNOTE_LEADING_PT = 1.0
FDA_MICRO_PT = 8.0
FDA_MICRO_LEADING_PT = 4.0

FDA_INDENT_SUB_PT = 8.0
FDA_INDENT_ADDED_PT = 16.0

FDA_TITLE = "Nutrition Facts"
FDA_FOOTNOTE = (
    "* The % Daily Value (DV) tells you how much a nutrient in a serving of "
    "food contributes to a daily diet. 2,000 calories a day is used for "
    "general nutrition advice."
)

# Main (bold) vs indented sub-nutrients
MAIN_NUTRIENTS: FrozenSet[str] = frozenset(
    {
        "total fat",
        "cholesterol",
        "sodium",
        "total carbohydrate",
        "total carbohydrates",
        "carbohydrates",
        "protein",
    }
)

SUB_NUTRIENTS: FrozenSet[str] = frozenset(
    {
        "saturated fat",
        "trans fat",
        "dietary fiber",
        "total sugars",
        "sugars",
    }
)

ADDED_SUGARS_NAMES: FrozenSet[str] = frozenset(
    {
        "added sugars",
        "includes added sugars",
    }
)

# Sub-nutrients that belong to the "Total Fat" parent group (no hairline between them)
FAT_SUB_GROUP: FrozenSet[str] = frozenset(
    {
        "total fat",
        "saturated fat",
        "trans fat",
    }
)

# Sub-nutrients that belong to the "Total Carbohydrate" parent group
CARB_PARENTS: FrozenSet[str] = frozenset(
    {
        "total carbohydrate",
        "total carbohydrates",
        "carbohydrates",
    }
)

CARB_SUB_GROUP: FrozenSet[str] = frozenset(
    {
        "dietary fiber",
        "total sugars",
        "sugars",
    }
)

MICRO_NUTRIENTS: Dict[str, str] = {
    "vitamin d": "Vitamin D",
    "vit. d": "Vitamin D",
    "vit d": "Vitamin D",
    "calcium": "Calcium",
    "iron": "Iron",
    "potassium": "Potassium",
    "potas.": "Potassium",
    "potas": "Potassium",
}

DISPLAY_NAMES: Dict[str, str] = {
    "carbohydrates": "Total Carbohydrate",
    "total carbohydrates": "Total Carbohydrate",
    "sugars": "Total Sugars",
}

STANDARD_NUTRIENT_ORDER: List[str] = [
    "Total Fat",
    "Saturated Fat",
    "Trans Fat",
    "Cholesterol",
    "Sodium",
    "Total Carbohydrate",
    "Carbohydrates",
    "Dietary Fiber",
    "Total Sugars",
    "Added Sugars",
    "Protein",
    "Vitamin D",
    "Calcium",
    "Iron",
    "Potassium",
]

# Backward-compatible aliases used by older renderer tests
FONT_HEADER = 28
FONT_NUTRIENT = 12
PADDING = 16
BORDER_WIDTH = 2
LINE_THIN = 1
LINE_MEDIUM = 3
LINE_THICK = 7
