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
import os
from nutrition_facts import NutritionFactsGenerator
from nutrition_facts.models import Nutrient, NutritionData, ServingInfo

# Khởi tạo bộ công cụ tạo ảnh nhãn dinh dưỡng
generator = NutritionFactsGenerator()

# ==============================================================================
# TEST: MUỐI ỚT TÔM KHÔ - 200g (Nâng kịch khung lên 50g/serving => Chỉ còn 4 Servings)
# HỆ QUẢ: Lượng Muối (Sodium) vọt lên tới 75% DV! Chỉ cần ăn một khẩu phần này là
# người tiêu dùng đã nạp gần hết lượng muối cho phép của CẢ MỘT NGÀY.
# ==============================================================================
data_muoi_test_50g = NutritionData(
    product_name="MUỐI ỚT TÔM KHÔ (TEST 50G)",
    serving_info=ServingInfo(serving_size="50g", servings_per_container=4),
    calories=90,  # 18 kcal x 5 lần
    nutrients=[
        Nutrient(name="Total Fat", value=0.5, unit="g", daily_value_percent=1),
        Nutrient(name="Saturated Fat", value=0, unit="g", daily_value_percent=0),
        Nutrient(name="Trans Fat", value=0, unit="g"),
        Nutrient(name="Cholesterol", value=40, unit="mg", daily_value_percent=13), # Tăng mạnh từ tôm khô
        
        # 🚨 ĐIỂM CHÍ MẠNG: Con số Sodium vọt lên vùng báo động đỏ (75% DV)
        Nutrient(name="Sodium", value=1725, unit="mg", daily_value_percent=75), 
        
        Nutrient(name="Total Carbohydrate", value=11, unit="g", daily_value_percent=4),
        Nutrient(name="Dietary Fiber", value=1, unit="g", daily_value_percent=4),
        Nutrient(name="Total Sugars", value=7.5, unit="g"),
        Nutrient(name="Added Sugars", value=6, unit="g", daily_value_percent=12),
        Nutrient(name="Protein", value=9, unit="g"), # Đạm tăng lên 9g nhìn thì thích nhưng không gánh nổi cột muối
        
        # Vi lượng nhân 5 lần
        Nutrient(name="Vitamin D", value=0, unit="mcg", daily_value_percent=0),
        Nutrient(name="Calcium", value=75, unit="mg", daily_value_percent=6),
        Nutrient(name="Iron", value=0.5, unit="mg", daily_value_percent=3),
        Nutrient(name="Potassium", value=110, unit="mg", daily_value_percent=2),
    ],
    manufacturer=None,
)

# ==============================================================================
# ĐỊNH TUYẾN VÀ TIẾN HÀNH XUẤT FILE ẢNH NHÃN DINH DƯỠNG
# ==============================================================================
all_labels = {
    "output/muoi_ot_tom_kho_50g_TEST.png": data_muoi_test_50g,
}

# Tạo thư mục output nếu chưa tồn tại
if not os.path.exists("output"):
    os.makedirs("output")

print("🚀 Đang chạy nhãn thử nghiệm 50g...")
for path_name, label_data in all_labels.items():
    if os.path.exists(path_name):
        os.remove(path_name)
        
    try:
        output = generator.generate(label_data, path_name)
        print(f"📸 Đã xuất ảnh test thành công: {path_name}")
        print("👉 Bạn hãy mở ảnh lên xem cột 'Sodium 75%' trông 'chát' thế nào nhé!")
    except Exception as e:
        print(f"❌ Lỗi: {e}")
