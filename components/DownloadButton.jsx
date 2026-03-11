"use client";

import { useState } from "react";

export default function DownloadButton({
  templateRef,
  fileName = "NIN-Slip",
  slipType = "full",
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    if (!templateRef?.current) {
      setError("Template not found");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const jsPDF = (await import("jspdf")).jsPDF;
      const element = templateRef.current;

      // ==========================================
      // FRONTEND-ONLY A4 STACKED LOGIC
      // ==========================================
      if (slipType === "premium" || slipType === "plastic") {

        // 1. Directly target the front and back elements inside the preview
        const frontElement = element.querySelector('.premium-card-front');
        const backElement = element.querySelector('.premium-card-back');

        if (!frontElement || !backElement) {
          throw new Error("Could not find the card faces on the screen.");
        }

        // 2. Temporarily disable the 3D flipping CSS so html2canvas can read it flat
        const originalBackTransform = backElement.style.transform;
        const originalBackDisplay = backElement.style.display;

        backElement.style.transform = 'none'; // Un-flip the back card
        backElement.style.display = 'block';

        // 3. Take High-Res pictures of the individual elements
        const captureOptions = { scale: 4, useCORS: true, backgroundColor: null, logging: false };

        const frontCanvas = await html2canvas(frontElement, captureOptions);
        const backCanvas = await html2canvas(backElement, captureOptions);

        // 4. Restore the 3D CSS so the user's UI doesn't break
        backElement.style.transform = originalBackTransform;
        backElement.style.display = originalBackDisplay;

        const frontImgData = frontCanvas.toDataURL("image/png");
        const backImgData = backCanvas.toDataURL("image/png");

        // 5. Create the A4 PDF Document
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Standard CR80 ID Card dimensions (85.6mm x 53.98mm)
        const cardW = 85.6;
        const cardH = 53.98;

        // Center Alignment for A4
        const pageWidth = pdf.internal.pageSize.getWidth();
        const xOffset = (pageWidth - cardW) / 2;

        // Vertical Spacing
        const yTop = 30; // 30mm from the top of the page
        const gap = 15; // 15mm gap between cards

        // 6. Draw Both Cards onto the A4 PDF
        pdf.addImage(frontImgData, "PNG", xOffset, yTop, cardW, cardH);
        pdf.addImage(backImgData, "PNG", xOffset, yTop + cardH + gap, cardW, cardH);

        // 7. Force Download
        pdf.save(`${fileName}-Print-Ready.pdf`);
        setIsLoading(false);
        return;
      }

      // ==========================================
      // STANDARD FULL PAGE SLIP LOGIC
      // ==========================================
      const canvas = await html2canvas(element, {
        scale: 4,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: 850,
        onclone: (clonedDoc, clonedElement) => {
            clonedElement.style.width = "850px";
            // Ensure any children that might shrink are also set
            clonedElement.style.maxWidth = "none";
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio
      const imgRatio = canvas.height / canvas.width;
      
      // Set margins (10mm on each side)
      const margin = 10;
      
      const maxImgWidth = pageWidth - (margin * 2);
      const maxImgHeight = pageHeight - (margin * 2);
      
      // Determine final dimensions
      let finalImgWidth = maxImgWidth;
      let finalImgHeight = finalImgWidth * imgRatio;
      
      // If the resulting height is too large for the page, scale down by height
      if (finalImgHeight > maxImgHeight) {
          finalImgHeight = maxImgHeight;
          finalImgWidth = finalImgHeight / imgRatio;
      }
      
      // Align to top centered horizontally
      const xPos = (pageWidth - finalImgWidth) / 2;
      const yPos = margin;

      pdf.addImage(imgData, "PNG", xPos, yPos, finalImgWidth, finalImgHeight);
      pdf.save(`${fileName}-Verified.pdf`);

    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="px-8 py-4 rounded-2xl font-black text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(0,135,81,0.2)] hover:shadow-[0_15px_30px_rgba(0,135,81,0.3)] hover:-translate-y-0.5 active:translate-y-0"
        style={{
          background: isLoading
            ? "#94a3b8"
            : "linear-gradient(135deg, #008751, #007043)",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
            <span>Processing Print File...</span>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span className="uppercase tracking-widest text-sm">Download Print PDF</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-2 font-bold px-4 py-2 bg-red-50 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}