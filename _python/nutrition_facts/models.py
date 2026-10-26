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
"""Pydantic models for nutrition facts label data."""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class Nutrient(BaseModel):
    """A single nutrient row on the label."""

    name: str = Field(..., min_length=1, description='Nutrient name, e.g. "Total Fat"')
    value: float = Field(..., ge=0, description="Amount of the nutrient")
    unit: str = Field(..., min_length=1, description='Unit, e.g. "g", "mg", "μg"')
    daily_value_percent: Optional[float] = Field(
        default=None,
        ge=0,
        description="Percent Daily Value, e.g. 23 for 23%",
    )

    @field_validator("name", "unit")
    @classmethod
    def strip_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty or whitespace")
        return stripped


class ServingInfo(BaseModel):
    """Serving size and servings per container."""

    serving_size: str = Field(..., min_length=1, description='e.g. "2 tbsp (32g)"')
    servings_per_container: float = Field(..., gt=0)

    @field_validator("serving_size")
    @classmethod
    def strip_serving_size(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("serving_size must not be empty or whitespace")
        return stripped


class NutritionData(BaseModel):
    """Complete nutrition facts input for one product label."""

    product_name: str = Field(..., min_length=1)
    serving_info: ServingInfo
    calories: int = Field(..., ge=0)
    nutrients: List[Nutrient] = Field(default_factory=list)
    manufacturer: Optional[str] = None

    @field_validator("product_name")
    @classmethod
    def strip_product_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("product_name must not be empty or whitespace")
        return stripped

    @field_validator("manufacturer")
    @classmethod
    def strip_manufacturer(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None
