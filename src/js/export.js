import { renderNutritionFacts } from "./nutrition-facts.js";

// Chuẩn hóa tên file để loại các ký tự Windows không cho phép.
export function safeFilename(value, fallback, extension = "svg") {
  const date = new Date();
  const datePrefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  const name = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\.svg$/i, "");
  return `${datePrefix}_${name || fallback}.${extension}`;
}

export function downloadSvg(svg, filename) {
  const source = new XMLSerializer().serializeToString(svg);
  const file = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPng(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

// Ghép các SVG theo chiều dọc để tải nhiều sản phẩm trong cùng một file.
export function createBatchSvg(products) {
  const labels = products.map(({ data }) => renderNutritionFacts(data));
  const width = Math.max(...labels.map((label) => Number(label.getAttribute("width"))));
  const gap = 16;
  let top = 0;
  const batch = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  batch.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  batch.setAttribute("width", String(width));
  batch.setAttribute(
    "viewBox",
    `0 0 ${width} ${labels.reduce((height, label) => height + Number(label.getAttribute("height")) + gap, 0)}`,
  );

  labels.forEach((label) => {
    label.setAttribute("x", "0");
    label.setAttribute("y", String(top));
    batch.append(label);
    top += Number(label.getAttribute("height")) + gap;
  });

  batch.setAttribute("height", String(top - gap));
  return batch;
}

// Canvas đổi SVG thành PNG để có thể copy ảnh vào clipboard.
export function convertSvgToPng(svgElement) {
  return new Promise((resolve, reject) => {
    const svgText = new XMLSerializer().serializeToString(svgElement);
    const svgFile = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgFile);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Không thể tạo ảnh PNG trong trình duyệt này."));
        return;
      }
      // Nền canvas trong suốt có thể bị một số ứng dụng hiển thị thành màu đen.
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);

      const pngDataUrl = canvas.toDataURL("image/png");

      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể chuyển SVG thành PNG."));
    };
    image.src = url;
  });
}

// Source - https://stackoverflow.com/a/16245768
// Posted by Jeremy, modified by community. See post 'Timeline' for change history
// Retrieved 2026-10-30, License - CC BY-SA 4.0

export const b64toBlob = (b64Data, contentType = "", sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};
