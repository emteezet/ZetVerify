"use client";

import { useState } from "react";

export default function DownloadButton({
  templateRef,
  fileName = "NIN-Slip",
  slipType = "full",
  renderCustom,
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
      
      // Ensure all fonts are loaded before capturing
      if (document.fonts) {
        await document.fonts.ready;
      }

      const element = templateRef.current;

      // ============================================================
      // HIDDEN RENDER STRATEGY (Solid Fix for Mobile Cropping)
      // ============================================================
      // Create a hidden, desktop-sized container to render the clone
      const hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "absolute";
      hiddenContainer.style.left = "-9999px";
      hiddenContainer.style.top = "0";
      hiddenContainer.style.width = slipType === "premium" || slipType === "plastic" ? "500px" : "900px";
      hiddenContainer.style.background = "white";
      document.body.appendChild(hiddenContainer);

      const clonedElement = element.cloneNode(true);
      hiddenContainer.appendChild(clonedElement);

      // ============================================================
      // WAIT FOR ASSETS & REFLOW (Fix for First-Time Positioning Errors)
      // ============================================================
      // 1. Wait for Images
      const images = Array.from(clonedElement.getElementsByTagName('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          const fallbackTimeout = setTimeout(resolve, 4000); // 4 seconds max per image
          img.onload = () => { clearTimeout(fallbackTimeout); resolve(); };
          img.onerror = () => { clearTimeout(fallbackTimeout); resolve(); };
          if (!img.src) { clearTimeout(fallbackTimeout); resolve(); }
        });
      }));

      // 2. Force a layout reflow on the hidden container
      // Accessing offsetHeight forces the browser to calculate geometry
      void hiddenContainer.offsetHeight; 

      // 3. Wait for two frames + small buffer to ensure styles are applied
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 300); 
        });
      }));

      let frontCanvas, backCanvas, mainCanvas;

      if (slipType === "premium" || slipType === "plastic") {
        // Target faces inside the CLONE
        const frontClone = clonedElement.querySelector('.premium-card-front');
        const backClone = clonedElement.querySelector('.premium-card-back');

        if (!frontClone || !backClone) {
          document.body.removeChild(hiddenContainer);
          throw new Error("Could not find the card faces in clones.");
        }

        // Flatten the back face in the clone
        backClone.style.transform = 'none';
        backClone.style.display = 'block';

        // Optimizing PDF size: Reducing scale from 4 to 2 (high quality enough for print)
        const captureOptions = { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true, // Fallback if CORS fails
          backgroundColor: null, 
          logging: false,
          windowWidth: 1024,
          windowHeight: 768
        };
        
        frontCanvas = await html2canvas(frontClone, captureOptions);
        backCanvas = await html2canvas(backClone, captureOptions);

      } else {
        // Standard full page slip via clone
        mainCanvas = await html2canvas(clonedElement, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true, // Fallback if CORS fails
          logging: false,
          width: 850,
          windowWidth: 1024,
          windowHeight: 768
        });
      }

      // Cleanup hidden container immediately after capture
      document.body.removeChild(hiddenContainer);

      // ==========================================
      // PDF GENERATION (Optimized Size)
      // ==========================================
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true // Internal PDF compression
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (slipType === "premium" || slipType === "plastic") {
        // Use JPEG with 0.7 compression for photographic quality vs size balance
        const frontImgData = frontCanvas.toDataURL("image/jpeg", 0.7);
        const backImgData = backCanvas.toDataURL("image/jpeg", 0.7);

        const cardW = 85.6;
        const cardH = 53.98;
        const xOffset = (pageWidth - cardW) / 2;
        const yTop = 30;
        const gap = 15;

        pdf.addImage(frontImgData, "JPEG", xOffset, yTop, cardW, cardH);
        pdf.addImage(backImgData, "JPEG", xOffset, yTop + cardH + gap, cardW, cardH);
        pdf.save(`${fileName}-Print-Ready.pdf`);

      } else {
        // Use JPEG with 0.7 compression for regular slips
        const imgData = mainCanvas.toDataURL("image/jpeg", 0.7);
        const imgRatio = mainCanvas.height / mainCanvas.width;
        const margin = 10;
        
        const maxImgWidth = pageWidth - (margin * 2);
        const maxImgHeight = pageHeight - (margin * 2);
        
        let finalImgWidth = maxImgWidth;
        let finalImgHeight = finalImgWidth * imgRatio;
        
        if (finalImgHeight > maxImgHeight) {
          finalImgHeight = maxImgHeight;
          finalImgWidth = finalImgHeight / imgRatio;
        }
        
        const xPos = (pageWidth - finalImgWidth) / 2;
        const yPos = margin;

        pdf.addImage(imgData, "JPEG", xPos, yPos, finalImgWidth, finalImgHeight);
        pdf.save(`${fileName}-Verified.pdf`);
      }

    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  if (renderCustom) {
      return renderCustom({ onClick: handleDownload, isLoading, error });
  }

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