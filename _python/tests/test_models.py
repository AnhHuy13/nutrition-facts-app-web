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
import pytest
from pydantic import ValidationError

from nutrition_facts.models import Nutrient, NutritionData, ServingInfo


def test_nutrient_valid():
    nutrient = Nutrient(name="Total Fat", value=18, unit="g", daily_value_percent=23)
    assert nutrient.name == "Total Fat"
    assert nutrient.value == 18
    assert nutrient.unit == "g"
    assert nutrient.daily_value_percent == 23


def test_nutrient_optional_daily_value():
    nutrient = Nutrient(name="Protein", value=7, unit="g")
    assert nutrient.daily_value_percent is None


def test_nutrient_strips_whitespace():
    nutrient = Nutrient(name="  Sodium  ", value=1, unit=" mg ")
    assert nutrient.name == "Sodium"
    assert nutrient.unit == "mg"


def test_nutrient_rejects_empty_name():
    with pytest.raises(ValidationError):
        Nutrient(name="   ", value=1, unit="g")


def test_nutrient_rejects_negative_value():
    with pytest.raises(ValidationError):
        Nutrient(name="Fat", value=-1, unit="g")


def test_serving_info_valid():
    info = ServingInfo(serving_size="2 tbsp (32g)", servings_per_container=14)
    assert info.servings_per_container == 14


def test_serving_info_rejects_zero_servings():
    with pytest.raises(ValidationError):
        ServingInfo(serving_size="1 cup", servings_per_container=0)


def test_nutrition_data_valid():
    data = NutritionData(
        product_name="Almond Butter",
        serving_info=ServingInfo(serving_size="2 tbsp (32g)", servings_per_container=14),
        calories=190,
        nutrients=[Nutrient(name="Protein", value=7, unit="g")],
    )
    assert data.product_name == "Almond Butter"
    assert data.manufacturer is None


def test_nutrition_data_blank_manufacturer_becomes_none():
    data = NutritionData(
        product_name="Tea",
        serving_info=ServingInfo(serving_size="1 bag", servings_per_container=20),
        calories=0,
        manufacturer="   ",
    )
    assert data.manufacturer is None


def test_nutrition_data_rejects_negative_calories():
    with pytest.raises(ValidationError):
        NutritionData(
            product_name="X",
            serving_info=ServingInfo(serving_size="1", servings_per_container=1),
            calories=-5,
        )


def test_nutrition_data_rejects_missing_product_name():
    with pytest.raises(ValidationError):
        NutritionData(
            serving_info=ServingInfo(serving_size="1", servings_per_container=1),
            calories=10,
        )
