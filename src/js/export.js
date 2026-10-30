import { renderNutritionFacts } from "./nutrition-facts.js";

export function safeFilename(value, fallback, extension) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");

  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\.svg$/i, "");

  const finalName = cleaned || fallback;
  return `${year}${month}${date}_${finalName}.${extension}`;
}

export function downloadSvg(svg, filename) {
  const source = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPng(base64, filename) {
  const link = document.createElement("a");
  link.href = base64;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

export async function convertSVGtoPNG(svgData) {
  //var svgElement = document.getElementById("svgElement");
  //var svgData = new XMLSerializer().serializeToString(svgElement);
  var pngData;

  const Func = new Promise((resolve, reject) => {
    try {
      var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(svgBlob);

      var img = new Image();

      img.onload = function () {
        var canvas = document.getElementById("canvasElement");
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;

        var context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        pngData = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(pngData);
      };
      img.src = url;
    } catch (error) {
      reject(`Lỗi ${error}`);
    }
  });
  return Func.then((msg) => {
    return msg;
  }).catch((err) => console.log(err));
}

console.log(
  await convertSVGtoPNG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 124 124" fill="none">
<rect width="124" height="124" rx="24" fill="#F97316"/>
<path d="M19.375 36.7818V100.625C19.375 102.834 21.1659 104.625 23.375 104.625H87.2181C90.7818 104.625 92.5664 100.316 90.0466 97.7966L26.2034 33.9534C23.6836 31.4336 19.375 33.2182 19.375 36.7818Z" fill="white"/>
<circle cx="63.2109" cy="37.5391" r="18.1641" fill="black"/>
<rect opacity="0.4" x="81.1328" y="80.7198" width="17.5687" height="17.3876" rx="4" transform="rotate(-45 81.1328 80.7198)" fill="#FDBA74"/>
</svg>`),
);

export function createBatchSvg(products) {
  const labels = products.map(({ data }) => renderNutritionFacts(data));
  const width = Math.max(...labels.map((svg) => Number(svg.getAttribute("width"))));
  const gap = 16;
  let y = 0;
  const batch = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  batch.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  batch.setAttribute("width", String(width));
  batch.setAttribute(
    "viewBox",
    `0 0 ${width} ${labels.reduce((total, svg) => total + Number(svg.getAttribute("height")) + gap, 0)}`,
  );
  labels.forEach((label) => {
    label.setAttribute("x", "0");
    label.setAttribute("y", String(y));
    batch.append(label);
    y += Number(label.getAttribute("height")) + gap;
  });
  batch.setAttribute("height", String(y - gap));
  return batch;
}
