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
"""Generate professional US Nutrition Facts label images from structured data."""

from nutrition_facts.generator import NutritionFactsGenerator
from nutrition_facts.models import Nutrient, NutritionData, ServingInfo

__version__ = "0.1.0"
__all__ = [
    "NutritionFactsGenerator",
    "NutritionData",
    "ServingInfo",
    "Nutrient",
]
