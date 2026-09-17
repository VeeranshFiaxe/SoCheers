/* Turns an uploaded PDF into the page pictures the Insights reader shows
   (components/BlogTabs.tsx draws a paper as images, not as the browser's
   PDF plugin). Done in the browser with pdf.js, so the server never has
   to open a PDF. */
import { upload } from "./api";

export async function renderPdfPages(
  file: Blob,
  onProgress: (done: number, total: number) => void,
): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const total = Math.min(doc.numPages, 400);
  const urls: string[] = new Array(total);
  let done = 0;
  onProgress(0, total);

  const renderOne = async (n: number) => {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 1240 / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("render failed"))), "image/jpeg", 0.82));
    const up = await upload(new File([blob], `page-${String(n).padStart(2, "0")}.jpg`, { type: "image/jpeg" }), "image");
    urls[n - 1] = up.url;
    page.cleanup();
    onProgress(++done, total);
  };

  /* three at a time: fast, without holding forty canvases in memory */
  let next = 1;
  const lane = async () => { while (next <= total) await renderOne(next++); };
  await Promise.all([lane(), lane(), lane()]);
  await task.destroy();
  return urls;
}
