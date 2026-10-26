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
"""Helper functions for formatting, fonts, and file handling."""

from pathlib import Path
from typing import List, Optional, Tuple

from PIL import ImageFont

from nutrition_facts.constants import (
    ADDED_SUGARS_NAMES,
    CARB_PARENTS,
    CARB_SUB_GROUP,
    DISPLAY_NAMES,
    FAT_SUB_GROUP,
    MAIN_NUTRIENTS,
    MICRO_NUTRIENTS,
    STANDARD_NUTRIENT_ORDER,
    SUB_NUTRIENTS,
)
from nutrition_facts.models import Nutrient


_FONT_REGULAR_CANDIDATES = [
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\helvetica.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
]

# Helvetica Black equivalent: Arial Black, then bold
_FONT_BLACK_CANDIDATES = [
    r"C:\Windows\Fonts\ariblk.ttf",
    r"C:\Windows\Fonts\Arial\ariblk.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "/Library/Fonts/Arial Black.ttf",
]


def format_nutrient_value(value: float, unit: str) -> str:
    """Format a nutrient amount, dropping trailing zeros for whole numbers."""
    if value == int(value):
        amount = str(int(value))
    else:
        amount = f"{value:g}"
    return f"{amount}{unit}"


def format_daily_value(percent: Optional[float]) -> Optional[str]:
    """Return a daily-value string like '23%', or None if not provided."""
    if percent is None:
        return None
    if percent == int(percent):
        return f"{int(percent)}%"
    return f"{percent:g}%"


def format_servings(count: float) -> str:
    """Format the FDA servings line, e.g. '14 servings per container'."""
    if count == int(count):
        number = str(int(count))
        n = int(count)
    else:
        number = f"{count:g}"
        n = count
    noun = "serving" if n == 1 else "servings"
    return f"{number} {noun} per container"


def normalize_nutrient_key(name: str) -> str:
    return " ".join(name.strip().lower().split())


def nutrient_role(name: str) -> str:
    """Return 'micro', 'added', 'sub', 'main', or 'other'."""
    key = normalize_nutrient_key(name)
    if key in MICRO_NUTRIENTS:
        return "micro"
    if key in ADDED_SUGARS_NAMES:
        return "added"
    if key in SUB_NUTRIENTS:
        return "sub"
    if key in MAIN_NUTRIENTS:
        return "main"
    return "other"


def display_nutrient_name(name: str) -> str:
    key = normalize_nutrient_key(name)
    if key in DISPLAY_NAMES:
        return DISPLAY_NAMES[key]
    if key in MICRO_NUTRIENTS:
        return MICRO_NUTRIENTS[key]
    return name


def sort_nutrients(nutrients: List[Nutrient]) -> List[Nutrient]:
    """Sort nutrients by FDA-style order; unknown names keep relative order at the end."""
    order = {name.lower(): index for index, name in enumerate(STANDARD_NUTRIENT_ORDER)}
    known = [n for n in nutrients if n.name.lower() in order]
    unknown = [n for n in nutrients if n.name.lower() not in order]
    known.sort(key=lambda item: order[item.name.lower()])
    return known + unknown


def partition_nutrients(nutrients: List[Nutrient]) -> Tuple[List[Nutrient], List[Nutrient]]:
    """Split into (macronutrient rows, vitamin/mineral rows) in FDA order."""
    ordered = sort_nutrients(nutrients)
    macros = [n for n in ordered if nutrient_role(n.name) != "micro"]
    micros = [n for n in ordered if nutrient_role(n.name) == "micro"]
    return macros, micros


def needs_full_hairline_before(prev_name: str, curr_name: str) -> bool:
    """Return True if a full-width hairline rule should precede curr_name.

    FDA rules (priority order):
      1. Before Protein (final main)  -> never a hairline
      2. Within FAT_SUB_GROUP (Total Fat / Saturated / Trans)  -> no hairline
      3. Carb parent -> first carb sub (Dietary Fiber / Total Sugars / Sugars)  -> no hairline
      4. Otherwise -> hairline needed.
    """
    prev = normalize_nutrient_key(prev_name)
    curr = normalize_nutrient_key(curr_name)

    # 1. Protein is the last main macro — FDA draws no hairline above it.
    if curr == "protein":
        return False

    # 2. Fat sub-group members stay grouped without hairlines.
    if prev in FAT_SUB_GROUP and curr in FAT_SUB_GROUP:
        return False

    # 3. Transitioning from a Carb parent directly to one of its sub-nutrients.
    if prev in CARB_PARENTS and curr in CARB_SUB_GROUP:
        return False

    return True


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Load Helvetica Regular / Helvetica Black stand-ins (Arial / Arial Black)."""
    size = max(1, int(size))
    candidates = _FONT_BLACK_CANDIDATES if bold else _FONT_REGULAR_CANDIDATES
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def ensure_parent_dir(output_path: str) -> Path:
    """Create parent directories for the output path if needed."""
    path = Path(output_path)
    if path.parent and not path.parent.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
    return path