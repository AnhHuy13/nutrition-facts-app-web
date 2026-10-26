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
"""Generate FDA-style Nutrition Facts label images from structured data."""

from typing import List, Optional

from PIL import Image, ImageDraw

from nutrition_facts.constants import (
    COLOR_WHITE,
    DEFAULT_DPI,
    DEFAULT_HEIGHT,
    DEFAULT_WIDTH,
    FDA_AMOUNT_PT,
    FDA_BOX_PT,
    FDA_CALORIES_LABEL_PT,
    FDA_CALORIES_VALUE_PT,
    FDA_DV_HEADER_PT,
    FDA_FOOTNOTE,
    FDA_FOOTNOTE_LEADING_PT,
    FDA_FOOTNOTE_PT,
    FDA_HAIRLINE_PAD_PT,
    FDA_INDENT_ADDED_PT,
    FDA_INDENT_SUB_PT,
    FDA_INSET_PT,
    FDA_MICRO_LEADING_PT,
    FDA_MICRO_PT,
    FDA_NUTRIENT_LEADING_PT,
    FDA_NUTRIENT_PT,
    FDA_RULE_HAIRLINE_PT,
    FDA_RULE_HEAVY_PT,
    FDA_RULE_MEDIUM_PT,
    FDA_SERVING_SIZE_PT,
    FDA_SERVINGS_LEADING_PT,
    FDA_SERVINGS_PT,
    FDA_TITLE,
    LABEL_WIDTH_INCHES,
    POINTS_PER_INCH,
    RGB_WHITE,
)
from nutrition_facts.models import Nutrient, NutritionData
from nutrition_facts.renderer import (
    draw_border,
    draw_horizontal_line,
    draw_nutrient_row,
    draw_text,
    draw_text_right,
    fit_font_size,
    measure_text,
    wrap_text,
)
from nutrition_facts.utils import (
    display_nutrient_name,
    ensure_parent_dir,
    format_daily_value,
    format_nutrient_value,
    format_servings,
    load_font,
    needs_full_hairline_before,
    nutrient_role,
    partition_nutrients,
)


class NutritionFactsGenerator:
    """Create a US FDA vertical Nutrition Facts label from NutritionData."""

    def __init__(
        self,
        width: int = DEFAULT_WIDTH,
        height: int = DEFAULT_HEIGHT,
        dpi: int = DEFAULT_DPI,
    ) -> None:
        if width < 200 or height < 200:
            raise ValueError("width and height must be at least 200 pixels")

        if dpi < 72:
            raise ValueError("dpi must be at least 72")

        self.width = width
        self.height = height
        self.dpi = dpi

        self._px_per_pt = width / (
            LABEL_WIDTH_INCHES * POINTS_PER_INCH
        )

        self._inset = self._pt(FDA_INSET_PT)
        self._box = max(1, self._pt(FDA_BOX_PT))

        self._left = self._box + self._inset
        self._right = width - self._box - self._inset
        self._content_width = self._right - self._left

        self._cursor_y = 0
        self._title_px = 0

    def _pt(self, points: float) -> int:
        if points <= 0:
            return 0

        px = points * self._px_per_pt
        return max(1, round(px))

    def generate(
        self,
        data: NutritionData,
        output_path: str,
    ) -> str:
        """Validate data, render a label image, save it, and return the path."""

        self._validate_data(data)

        img = self._create_blank_image()

        self._draw_header(img, data)
        self._draw_calories(img, data.calories)
        self._draw_nutrient_table(img, data.nutrients)
        self._draw_footer(img, data)

        img = self._crop_and_frame(img)

        return self._save_image(img, output_path)

    def _validate_data(self, data: NutritionData) -> None:
        if not isinstance(data, NutritionData):
            raise TypeError(
                "data must be a NutritionData instance"
            )

        payload = (
            data.model_dump()
            if hasattr(data, "model_dump")
            else data.dict()
        )

        if hasattr(NutritionData, "model_validate"):
            NutritionData.model_validate(payload)
        else:
            NutritionData.parse_obj(payload)

    def _create_blank_image(self) -> Image.Image:
        canvas_h = max(self.height, 2400)

        img = Image.new(
            "RGB",
            (self.width, canvas_h),
            RGB_WHITE,
        )

        self._cursor_y = self._box + self._inset

        return img

    def _rule(
        self,
        img: Image.Image,
        thickness_pt: float,
        x: Optional[int] = None,
        width: Optional[int] = None,
    ) -> None:
        x0 = self._left if x is None else x
        w = self._content_width if width is None else width

        thickness = self._pt(thickness_pt)

        draw_horizontal_line(
            img,
            self._cursor_y,
            w,
            thickness=thickness,
            x=x0,
        )

        self._cursor_y += thickness

    def _draw_header(
        self,
        img: Image.Image,
        data: NutritionData,
    ) -> None:
        # 1. Đẩy tiêu đề xuống dưới một chút so với mép trên
        self._cursor_y += self._pt(8)

        min_title = self._pt(18)
        max_title = self._pt(36)
        title_max_w = max(10, self._content_width - self._pt(1))

        self._title_px = fit_font_size(
            FDA_TITLE, title_max_w, bold=True, min_size=min_title, max_size=max_title,
        )

        # Vẽ tiêu đề
        draw_text(img, (self._left, self._cursor_y), FDA_TITLE, self._title_px, bold=True)

        # 2. Xử lý khoảng trống (Layout)
        font = load_font(self._title_px, bold=True)
        ascent, descent = font.getmetrics()
        
        # 'title_h' là chiều cao bao gồm cả khoảng đệm mặc định của font
        _, title_h = measure_text(FDA_TITLE, self._title_px, bold=True)
        
        # Ép dòng dưới lên: Vị trí mới = vị trí hiện tại + title_h - descent - khoảng mong muốn
        # Bạn có thể điều chỉnh số 4 (pixel) để thấy thay đổi rõ rệt
        self._cursor_y = self._cursor_y + title_h - descent - self._pt(-3)

        # Vẽ "Servings per container"
        servings = format_servings(data.serving_info.servings_per_container)
        servings_px = self._pt(FDA_SERVINGS_PT)
        draw_text(img, (self._left, self._cursor_y), servings, servings_px, bold=False)

        _, servings_h = measure_text(servings, servings_px, bold=False)
        self._cursor_y += servings_h + self._pt(FDA_SERVINGS_LEADING_PT)

        # Vẽ "Serving size"
        size_px = self._pt(FDA_SERVING_SIZE_PT)
        label = "Serving size"
        draw_text(img, (self._left, self._cursor_y), label, size_px, bold=True)
        draw_text_right(img, self._right, self._cursor_y, data.serving_info.serving_size, size_px, bold=False)

        _, size_h = measure_text(label, size_px, bold=True)
        self._cursor_y += size_h + self._pt(2)

        self._rule(img, FDA_RULE_HEAVY_PT)

    def _get_text_height(
        self,
        text: str,
        font_size: int,
        bold: bool = False,
    ) -> int:
        font = load_font(
            font_size,
            bold=bold,
        )

        dummy = Image.new(
            "RGB",
            (1, 1),
            RGB_WHITE,
        )

        draw = ImageDraw.Draw(dummy)

        bbox = draw.textbbox(
            (0, 0),
            text,
            font=font,
            anchor="lt",
        )

        return max(
            1,
            bbox[3] - bbox[1],
        )

    def _draw_calories(
        self,
        img: Image.Image,
        calories: int,
    ) -> None:
        self._cursor_y += self._pt(3)

        amount_px = self._pt(FDA_AMOUNT_PT)

        draw_text(
            img,
            (self._left, self._cursor_y),
            "Amount per serving",
            amount_px,
            bold=True,
        )

        amount_h = self._get_text_height(
            "Amount per serving",
            amount_px,
            bold=True,
        )

        self._cursor_y += amount_h + self._pt(1)

        cal_label_px = self._pt(
            FDA_CALORIES_LABEL_PT
        )

        cal_value_px = max(
            self._pt(FDA_CALORIES_VALUE_PT),
            int(self._title_px * 1.08),
        )

        cal_text = str(calories)

        label_h = self._get_text_height(
            "Calories",
            cal_label_px,
            bold=True,
        )

        value_h = self._get_text_height(
            cal_text,
            cal_value_px,
            bold=True,
        )

        row_h = max(
            label_h,
            value_h,
        )

        label_y = (
            self._cursor_y
            + row_h
            - label_h
        )

        value_y = (
            self._cursor_y
            + row_h
            - value_h
        )

        draw_text(
            img,
            (self._left, label_y),
            "Calories",
            cal_label_px,
            bold=True,
        )

        draw_text_right(
            img,
            self._right,
            value_y,
            cal_text,
            cal_value_px,
            bold=True,
        )

        # Tăng khoảng cách đệm (padding) từ Calories xuống đường kẻ dưới
        # để nhãn trông thanh thoát và bớt tù túng hơn.
        self._cursor_y += row_h + self._pt(4)

        self._rule(
            img,
            FDA_RULE_MEDIUM_PT,
        )

    def _hairline_gap(
        self,
        img: Image.Image,
        x: Optional[int] = None,
        width: Optional[int] = None,
    ) -> None:
        pad = self._pt(FDA_HAIRLINE_PAD_PT)

        self._cursor_y += pad

        self._rule(
            img,
            FDA_RULE_HAIRLINE_PT,
            x=x,
            width=width,
        )

        self._cursor_y += pad

    def _draw_nutrient_table(
        self,
        img: Image.Image,
        nutrients: List[Nutrient],
    ) -> None:
        # Tăng khoảng cách từ đường kẻ trung bình phía trên xuống chữ "% Daily Value*"
        self._cursor_y += self._pt(4)

        dv_px = self._pt(FDA_DV_HEADER_PT)
        header = "% Daily Value*"

        draw_text_right(
            img,
            self._right,
            self._cursor_y,
            header,
            dv_px,
            bold=True,
        )

        _, dv_h = measure_text(
            header,
            dv_px,
            bold=True,
        )

        self._cursor_y += dv_h + self._pt(1)

        self._hairline_gap(img)

        macros, micros = partition_nutrients(
            nutrients
        )

        nut_px = self._pt(
            FDA_NUTRIENT_PT
        )

        if not macros:
            self._cursor_y += self._pt(
                FDA_NUTRIENT_LEADING_PT
            )
        else:
            for index, nutrient in enumerate(macros):
                if index > 0:
                    role = nutrient_role(
                        nutrient.name
                    )

                    if role == "added":
                        indent_x = (
                            self._left
                            + self._pt(
                                FDA_INDENT_ADDED_PT
                            )
                        )

                        self._hairline_gap(
                            img,
                            x=indent_x,
                            width=(
                                self._right
                                - indent_x
                            ),
                        )
                    else:
                        self._hairline_gap(img)

                self._draw_one_macro(
                    img,
                    nutrient,
                    nut_px,
                )

        self._cursor_y += self._pt(2)

        self._rule(
            img,
            FDA_RULE_HEAVY_PT,
        )

        if micros:
            self._cursor_y += self._pt(2)

            self._draw_micronutrients(
                img,
                micros,
            )

            self._cursor_y += self._pt(2)

        self._rule(
            img,
            FDA_RULE_HEAVY_PT,
        )

        self._cursor_y += self._pt(2)

    def _draw_one_macro(
        self,
        img: Image.Image,
        nutrient: Nutrient,
        font_px: int,
    ) -> None:
        role = nutrient_role(
            nutrient.name
        )

        value = format_nutrient_value(
            nutrient.value,
            nutrient.unit,
        )

        dv = format_daily_value(
            nutrient.daily_value_percent
        )

        if role == "added":
            label = (
                f"Includes {value} Added Sugars"
            )

            indent = self._pt(
                FDA_INDENT_ADDED_PT
            )

            height = draw_nutrient_row(
                img,
                self._cursor_y,
                label,
                "",
                dv,
                indent=indent,
                name_bold=False,
                font_size=font_px,
                left=self._left,
                right=self._right,
            )

        else:
            label = display_nutrient_name(
                nutrient.name
            )

            indent = (
                self._pt(FDA_INDENT_SUB_PT)
                if role == "sub"
                else 0
            )

            height = draw_nutrient_row(
                img,
                self._cursor_y,
                label,
                value,
                dv,
                indent=indent,
                name_bold=(role == "main"),
                font_size=font_px,
                left=self._left,
                right=self._right,
            )

        self._cursor_y += height

    def _draw_micronutrients(
        self,
        img: Image.Image,
        micros: List[Nutrient],
    ) -> None:
        font_px = self._pt(FDA_MICRO_PT)

        abbreviations = {
            "vitamin d": "Vit. D",
            "vit. d": "Vit. D",
            "vit d": "Vit. D",
            "potassium": "Potas.",
            "potas.": "Potas.",
            "potas": "Potas.",
        }

        items = []

        for nutrient in micros:
            name_key = " ".join(nutrient.name.strip().lower().split())
            name = abbreviations.get(
                name_key,
                display_nutrient_name(nutrient.name)
            )

            amount = format_nutrient_value(
                nutrient.value,
                nutrient.unit,
            )

            dv = format_daily_value(
                nutrient.daily_value_percent
            )

            piece = f"{name} {amount}"
            if dv:
                piece = f"{piece} {dv}"

            items.append(piece)

        rows = [
            items[i : i + 2]
            for i in range(0, len(items), 2)
        ]

        mid_x = self._left + self._content_width // 2

        for row_i, row in enumerate(rows):
            _, h = measure_text("A", font_px, bold=False)

            if len(row) == 1:
                draw_text(
                    img,
                    (self._left, self._cursor_y),
                    row[0],
                    font_px,
                    bold=False,
                    anchor="lt",
                )
            else:
                draw_text(
                    img,
                    (self._left, self._cursor_y),
                    row[0],
                    font_px,
                    bold=False,
                    anchor="lt",
                )

                draw_text_right(
                    img,
                    self._right,
                    self._cursor_y,
                    row[1],
                    font_px,
                    bold=False,
                    anchor="rt",
                )

                # Căn chỉnh vị trí X của bullet một cách thủ công dựa trên chiều rộng glyph thực tế
                # để đạt được trạng thái căn giữa toán học hoàn hảo
                bullet_w, _ = measure_text("•", font_px, bold=True)
                bullet_x = mid_x - (bullet_w // 2)

                draw_text(
                    img,
                    (bullet_x, self._cursor_y),
                    "•",
                    font_px,
                    bold=True,
                    anchor="lt",
                )

            self._cursor_y += h

            if row_i < len(rows) - 1:
                self._hairline_gap(img)

    def _draw_footer(
        self,
        img: Image.Image,
        data: NutritionData,
    ) -> None:
        footnote_px = self._pt(
            FDA_FOOTNOTE_PT
        )

        line_gap = self._pt(
            FDA_FOOTNOTE_LEADING_PT
        )

        lines = wrap_text(
            FDA_FOOTNOTE,
            footnote_px,
            False,
            self._content_width,
        )

        for index, line in enumerate(lines):
            draw_text(
                img,
                (self._left, self._cursor_y),
                line,
                footnote_px,
                bold=False,
            )

            _, h = measure_text(
                line,
                footnote_px,
                bold=False,
            )

            self._cursor_y += h

            if index < len(lines) - 1:
                self._cursor_y += line_gap

        self._cursor_y += self._inset

    def _crop_and_frame(
        self,
        img: Image.Image,
    ) -> Image.Image:
        bottom = min(
            img.height,
            max(
                self._cursor_y + self._box,
                self._box * 2 + 10,
            ),
        )

        cropped = img.crop(
            (
                0,
                0,
                self.width,
                bottom,
            )
        )

        draw_border(
            cropped,
            thickness=self._box,
        )

        return cropped

    def _save_image(
        self,
        img: Image.Image,
        output_path: str,
    ) -> str:
        path = ensure_parent_dir(
            output_path
        )

        suffix = path.suffix.lower()

        if suffix not in {
            ".png",
            ".jpg",
            ".jpeg",
        }:
            raise ValueError(
                "output_path must end with "
                ".png, .jpg, or .jpeg"
            )

        save_kwargs = {
            "dpi": (
                self.dpi,
                self.dpi,
            )
        }

        if suffix in {
            ".jpg",
            ".jpeg",
        }:
            rgb = Image.new(
                "RGB",
                img.size,
                COLOR_WHITE,
            )

            rgb.paste(img)

            rgb.save(
                path,
                format="JPEG",
                quality=95,
                **save_kwargs,
            )
        else:
            img.save(
                path,
                format="PNG",
                **save_kwargs,
            )

        return str(path.resolve())