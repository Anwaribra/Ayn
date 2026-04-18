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

const UNSUPPORTED_COLOR_FN = /\b(?:oklab|oklch|lab|lch|color-mix)\(/i;

const COLOR_STYLE_PROPERTIES = [
  "color",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "caretColor",
  "fill",
  "stroke",
] as const;

const resolveSafeCssValue = (
  sandbox: HTMLDivElement,
  property: string,
  value: string,
) => {
  if (!value || !UNSUPPORTED_COLOR_FN.test(value)) return value;

  const previous = sandbox.style.getPropertyValue(property);
  sandbox.style.setProperty(property, value);
  const resolved = window.getComputedStyle(sandbox).getPropertyValue(property).trim();
  sandbox.style.setProperty(property, previous);

  if (!resolved || UNSUPPORTED_COLOR_FN.test(resolved)) return "";
  return resolved;
};

const sanitizeExportColors = (root: HTMLElement) => {
  const sandbox = document.createElement("div");
  sandbox.setAttribute("aria-hidden", "true");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-30000px";
  sandbox.style.top = "0";
  sandbox.style.pointerEvents = "none";
  sandbox.style.opacity = "0";
  document.body.appendChild(sandbox);

  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  nodes.forEach((node) => {
    const computed = window.getComputedStyle(node);

    COLOR_STYLE_PROPERTIES.forEach((property) => {
      const value = computed[property];
      if (!value || !UNSUPPORTED_COLOR_FN.test(value)) return;

      const safeValue = resolveSafeCssValue(sandbox, property, value);
      if (safeValue) {
        node.style.setProperty(property, safeValue);
      }
    });

    const boxShadow = computed.boxShadow;
    if (boxShadow && UNSUPPORTED_COLOR_FN.test(boxShadow)) {
      node.style.boxShadow = "none";
    }

    const textShadow = computed.textShadow;
    if (textShadow && UNSUPPORTED_COLOR_FN.test(textShadow)) {
      node.style.textShadow = "none";
    }

    const backgroundImage = computed.backgroundImage;
    if (backgroundImage && UNSUPPORTED_COLOR_FN.test(backgroundImage)) {
      node.style.backgroundImage = "none";
    }
  });

  sandbox.remove();
};

export interface ExportPDFOptions {
  backgroundColor?: string;
  toastLabel?: string;
}

export const exportToPDF = async (
  elementId: string,
  filename: string = "audit-report.pdf",
  options: ExportPDFOptions = {},
) => {
  const toastId = "gap-analysis-export";
  const bgColor = options.backgroundColor ?? "#050810";
  const toastLabel = options.toastLabel ?? "report";
  let exportedFallbackSnapshot = false;

  try {
    const sourceElement = document.getElementById(elementId);
    if (!sourceElement) throw new Error("Report element not found");

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    toast.loading(`Preparing ${toastLabel} export…`, {
      id: toastId,
      description: "Capturing a snapshot of the current view.",
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
      sanitizeExportColors(clone);
      await waitForImages(clone);
      await waitForNextFrame();
      await waitForNextFrame();

      const canvas = await html2canvas(clone, {
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        backgroundColor: bgColor,
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
        description: "Your PDF report has been saved.",
      });
    } catch (error) {
      const fallbackCanvas = await html2canvas(clone, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: bgColor,
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
