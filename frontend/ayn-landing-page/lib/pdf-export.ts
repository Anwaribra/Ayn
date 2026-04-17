import { toast } from "sonner";

const waitForNextFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
};

const downloadFallbackSnapshot = (dataUrl: string, filename: string) => {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename.replace(/\.pdf$/i, ".png");
  anchor.click();
};

export const exportToPDF = async (
  elementId: string,
  filename: string = "audit-report.pdf",
) => {
  const toastId = "gap-analysis-export";
  let exportedFallbackSnapshot = false;

  try {
    const sourceElement = document.getElementById(elementId);
    if (!sourceElement) throw new Error("Report element not found");

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    toast.loading("Preparing report export...", {
      id: toastId,
      description: "Capturing a clean snapshot of the report.",
    });

    if ("fonts" in document) {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    }

    const exportHost = document.createElement("div");
    exportHost.setAttribute("aria-hidden", "true");
    exportHost.style.position = "fixed";
    exportHost.style.left = "-20000px";
    exportHost.style.top = "0";
    exportHost.style.width = `${Math.max(sourceElement.scrollWidth, sourceElement.clientWidth, 1280)}px`;
    exportHost.style.pointerEvents = "none";
    exportHost.style.opacity = "0";
    exportHost.style.zIndex = "-1";

    const clone = sourceElement.cloneNode(true) as HTMLElement;
    clone.style.width = "100%";
    clone.style.maxWidth = "none";
    clone.style.height = "auto";
    clone.style.overflow = "visible";
    clone.style.transform = "none";
    clone.style.pointerEvents = "none";

    exportHost.appendChild(clone);
    document.body.appendChild(exportHost);

    try {
      await waitForImages(clone);
      await waitForNextFrame();
      await waitForNextFrame();

      const canvas = await html2canvas(clone, {
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        backgroundColor: "#050810",
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const pageHeightPx = Math.floor((canvas.width * usableHeight) / usableWidth);

      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const pageContext = pageCanvas.getContext("2d");
        if (!pageContext) throw new Error("Failed to render PDF page");

        pageContext.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        );

        const pageImageData = pageCanvas.toDataURL("image/png");
        const pageImageHeight = (sliceHeight * usableWidth) / canvas.width;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(pageImageData, "PNG", margin, margin, usableWidth, pageImageHeight, undefined, "FAST");

        renderedHeight += sliceHeight;
        pageIndex += 1;
      }

      pdf.save(filename);

      toast.success("Report exported", {
        id: toastId,
        description: "Saved a screenshot-style PDF of the current report.",
      });
    } catch (error) {
      const fallbackCanvas = await html2canvas(clone, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#050810",
        logging: false,
      });

      downloadFallbackSnapshot(fallbackCanvas.toDataURL("image/png"), filename);
      exportedFallbackSnapshot = true;

      toast.success("Exported as image snapshot", {
        id: toastId,
        description: "PDF failed, so we downloaded a clean PNG instead.",
      });

      throw error;
    } finally {
      exportHost.remove();
    }
  } catch (error) {
    console.error(error);
    if (!exportedFallbackSnapshot) {
      toast.error("Failed to export report", {
        id: toastId,
        description: error instanceof Error ? error.message : "Unknown export error",
      });
    }
  }
};
