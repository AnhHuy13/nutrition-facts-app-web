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
from pathlib import Path

import pytest
from pydantic import ValidationError

from nutrition_facts.generator import NutritionFactsGenerator
from nutrition_facts.models import Nutrient, NutritionData, ServingInfo


def _sample_data(**overrides) -> NutritionData:
    payload = dict(
        product_name="Almond Butter",
        serving_info=ServingInfo(serving_size="2 tbsp (32g)", servings_per_container=14),
        calories=190,
        nutrients=[
            Nutrient(name="Total Fat", value=18, unit="g", daily_value_percent=23),
            Nutrient(name="Protein", value=7, unit="g", daily_value_percent=14),
        ],
        manufacturer="Example Foods",
    )
    payload.update(overrides)
    return NutritionData(**payload)


def test_generate_png(tmp_path: Path):
    out = tmp_path / "label.png"
    path = NutritionFactsGenerator().generate(_sample_data(), str(out))
    assert Path(path).exists()
    assert Path(path).stat().st_size > 0


def test_generate_jpeg(tmp_path: Path):
    out = tmp_path / "label.jpg"
    path = NutritionFactsGenerator().generate(_sample_data(), str(out))
    assert Path(path).exists()


def test_generate_empty_nutrients(tmp_path: Path):
    data = _sample_data(nutrients=[], manufacturer=None)
    path = NutritionFactsGenerator().generate(data, str(tmp_path / "empty.png"))
    assert Path(path).exists()


def test_generate_long_product_name(tmp_path: Path):
    data = _sample_data(product_name="A" * 80)
    path = NutritionFactsGenerator().generate(data, str(tmp_path / "long.png"))
    assert Path(path).exists()


def test_generate_rejects_non_nutrition_data(tmp_path: Path):
    with pytest.raises(TypeError):
        NutritionFactsGenerator().generate({"calories": 1}, str(tmp_path / "x.png"))


def test_generate_rejects_bad_extension(tmp_path: Path):
    with pytest.raises(ValueError, match="output_path"):
        NutritionFactsGenerator().generate(_sample_data(), str(tmp_path / "label.gif"))


def test_constructor_rejects_tiny_canvas():
    with pytest.raises(ValueError):
        NutritionFactsGenerator(width=50, height=50)


def test_invalid_nested_data_rejected_by_model():
    with pytest.raises(ValidationError):
        NutritionData(
            product_name="X",
            serving_info=ServingInfo(serving_size="1", servings_per_container=-1),
            calories=10,
        )
