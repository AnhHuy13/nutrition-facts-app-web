# Nutrition Facts App

## Chạy ứng dụng

```sh
npm install
npm run dev
```

Để đóng gói bản dùng thử, chạy `npm run build`. Vite lưu bản đã đóng gói trong `dist/`.

## Các file chính

- `src/js/App.jsx` giữ danh sách sản phẩm và nối các phần giao diện với nhau.
- `src/js/components/` chứa sidebar, tab, biểu mẫu và vùng xem trước.
- `src/js/daily-values.js` tính %DV từ lượng chất đã nhập.
- `src/js/calorie-calculation.js` dùng bảng hệ số để tính calories tự động.
- `src/js/export.js` tải nhãn SVG, ghép nhiều nhãn và đổi SVG sang PNG.
- `src/js/nutrition-facts.js` vẫn là bộ dựng nhãn: nhận dữ liệu và trả về một phần tử SVG. React chỉ gọi file này khi cần xem trước hoặc xuất nhãn.

Trong `App.jsx`, hàm `updateActiveProduct` chỉ thay dữ liệu của tab đang mở; các tab còn lại được giữ nguyên. `PreviewPanel` gọi bộ dựng SVG khi dữ liệu đổi, còn những hàm xuất file dùng cùng bộ dựng để tránh khác biệt giữa xem trước và file tải xuống.
