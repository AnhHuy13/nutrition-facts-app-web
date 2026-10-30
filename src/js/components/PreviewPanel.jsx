import { useEffect, useState } from "react";
import { renderNutritionFacts } from "../nutrition-facts.js";

export default function PreviewPanel({ data, ready, onSvgChange }) {
  const [preview, setPreview] = useState({
    svg: "",
    message: "Chưa có đủ thông tin để hiển thị nhãn.",
  });

  useEffect(() => {
    if (!ready) {
      onSvgChange("");
      setPreview({
        svg: "",
        message: "Chưa có đủ thông tin để hiển thị nhãn.",
      });
      return;
    }

    try {
      // nutrition-facts.js vẫn dựng SVG; React nhận SVG đó để hiển thị và cập nhật mã xem trước.
      const svg = renderNutritionFacts(data);
      const svgText = new XMLSerializer().serializeToString(svg);
      setPreview({ svg: svgText, message: "" });
      onSvgChange(svgText);
    } catch (error) {
      onSvgChange("");
      setPreview({
        svg: "",
        message: `Chưa có nhãn để hiển thị: ${error.message}`,
      });
    }
  }, [data, ready, onSvgChange]);

  return (
    <section className="preview-panel" aria-label="Xem trước nhãn">
      {preview.svg ? (
        <div
          className="preview-stage"
          id="preview-stage"
          dangerouslySetInnerHTML={{ __html: preview.svg }}
        />
      ) : (
        <div className="preview-stage" id="preview-stage">
          <p className="preview-empty-state">{preview.message}</p>
        </div>
      )}
    </section>
  );
}
