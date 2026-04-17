import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export const exportToPDF = async (elementId: string, filename: string = "audit-report.pdf") => {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error("Report element not found");

    toast.info("Generating PDF...", { description: "Please wait while we capture the report.", duration: 3000 });

    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#050810", // the dark background mostly used
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    // Multi-page logic
    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(filename);
    toast.success("PDF exported successfully", { duration: 3000 });
  } catch (err: any) {
    console.error(err);
    toast.error("Failed to generate PDF", { description: err.message });
  }
};
