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
"""Pillow drawing helpers for Nutrition Facts labels."""

from typing import List, Optional, Tuple

from PIL import Image, ImageDraw

from nutrition_facts.constants import COLOR_BLACK
from nutrition_facts.utils import load_font


def _to_draw(img: Image.Image) -> ImageDraw.ImageDraw:
    return ImageDraw.Draw(img)


def draw_text(
    img: Image.Image,
    position: Tuple[int, int],
    text: str,
    font_size: int,
    bold: bool = False,
    color: str = COLOR_BLACK,
    anchor: str = "lt",
) -> None:
    """Draw text. Default anchor is top-left (Pillow 'lt')."""
    draw = _to_draw(img)
    font = load_font(font_size, bold=bold)
    draw.text(position, text, fill=color, font=font, anchor=anchor)


def draw_text_right(
    img: Image.Image,
    right_x: int,
    y: int,
    text: str,
    font_size: int,
    bold: bool = False,
    color: str = COLOR_BLACK,
    anchor: str = "rt",
) -> None:
    """Draw text right-aligned to right_x. Default anchor is top-right."""
    draw = _to_draw(img)
    font = load_font(font_size, bold=bold)
    draw.text((right_x, y), text, fill=color, font=font, anchor=anchor)


def measure_text(text: str, font_size: int, bold: bool = False) -> Tuple[int, int]:
    """Return (advance width, line height) using font metrics."""
    font = load_font(font_size, bold=bold)
    if hasattr(font, "getlength"):
        width = int(round(font.getlength(text)))
    else:
        dummy = Image.new("RGB", (8, 8))
        draw = ImageDraw.Draw(dummy)
        bbox = draw.textbbox((0, 0), text, font=font)
        width = bbox[2] - bbox[0]
    ascent, descent = font.getmetrics()
    return width, ascent + descent


def fit_font_size(
    text: str,
    max_width: int,
    bold: bool,
    min_size: int,
    max_size: int,
) -> int:
    """Largest font size in [min_size, max_size] whose text fits max_width."""
    best = min_size
    low, high = min_size, max_size
    while low <= high:
        mid = (low + high) // 2
        width, _ = measure_text(text, mid, bold=bold)
        if width <= max_width:
            best = mid
            low = mid + 1
        else:
            high = mid - 1
    return best


def wrap_text(text: str, font_size: int, bold: bool, max_width: int) -> List[str]:
    """Word-wrap text to max_width pixels."""
    words = text.split()
    if not words:
        return []
    lines: List[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        width, _ = measure_text(trial, font_size, bold=bold)
        if width <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_horizontal_line(
    img: Image.Image,
    y: int,
    width: int,
    thickness: int = 1,
    color: str = COLOR_BLACK,
    x: int = 0,
) -> None:
    """Draw a horizontal bar from x to x+width at y."""
    draw = _to_draw(img)
    thickness = max(1, thickness)
    draw.rectangle([x, y, x + width - 1, y + thickness - 1], fill=color)


def draw_border(img: Image.Image, thickness: int = 1, color: str = COLOR_BLACK) -> None:
    """Draw a rectangle border around the image."""
    draw = _to_draw(img)
    w, h = img.size
    for i in range(max(1, thickness)):
        draw.rectangle([i, i, w - 1 - i, h - 1 - i], outline=color)


def draw_nutrient_row(
    img: Image.Image,
    y: int,
    label: str,
    value: str,
    daily_value: Optional[str] = None,
    indent: int = 0,
    name_bold: bool = True,
    font_size: int = 12,
    left: Optional[int] = None,
    right: Optional[int] = None,
) -> int:
    """Draw one nutrient line: bold/regular name, regular amount, bold %DV.

    Returns the text height used.
    """
    if left is None:
        left = 16
    if right is None:
        right = img.width - 16
    x = left + indent
    draw_text(img, (x, y), label, font_size, bold=name_bold)
    name_w, name_h = measure_text(label, font_size, bold=name_bold)
    value_h = 0
    if value:
        gap, _ = measure_text(" ", font_size, bold=False)
        draw_text(img, (x + name_w + gap, y), value, font_size, bold=False)
        _, value_h = measure_text(value, font_size, bold=False)
    if daily_value:
        draw_text_right(img, right, y, daily_value, font_size, bold=True)
    return max(name_h, value_h, 1)
