"use client";

import { useEffect, useState, useRef } from "react";
import { 
  FileText, 
  Download, 
  Search, 
  Loader2, 
  Calendar, 
  ShieldCheck, 
  CreditCard,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import DownloadButton from "@/components/DownloadButton";
import PremiumPlasticCard from "@/components/PremiumPlasticCard";
import NinRegularSlip from "@/components/NinRegularSlip";
import ImprovedNinSlip from "@/components/ImprovedNinSlip";

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState(null);
  const documentRef = useRef(null);
  const downloadBtnRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Automate download when record is selected
  useEffect(() => {
    if (selectedRecord && downloadBtnRef.current) {
      const timer = setTimeout(() => {
        downloadBtnRef.current.click();
        setToast({ message: "Download started!", type: "success" });
        setTimeout(() => {
           setSelectedRecord(null);
           setToast(null);
        }, 3000);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedRecord]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/verifications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch history");
      setRecords(data.records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = async (recordId) => {
    setLoadingId(recordId);
    setToast({ message: "Preparing your slip...", type: "loading" });
    try {
      const res = await fetch(`/api/verifications/${recordId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch details");
      setSelectedRecord(data.record);
    } catch (err) {
      setToast({ message: `Error: ${err.message}`, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#19325C] mb-4" />
        <p className="text-slate-500 font-medium tracking-tight">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#19325C] tracking-tight">My Generated Slips</h1>
        <p className="text-slate-500 mt-1">A historical list of all your NIN/BVN verifications.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-6 flex items-center gap-2">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No history found</h2>
          <p className="text-slate-500 max-w-xs mx-auto">Your generated slips will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <div 
              key={record.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 group hover:border-[#19325C]/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${record.type.includes('NIN') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  {record.type.includes('NIN') ? <ShieldCheck className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-none mb-2">
                    {record.identifier}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-black">
                      {record.slip_type.toUpperCase()} SLIP
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(record.created_at).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownloadClick(record.id)}
                disabled={!!loadingId}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#19325C] text-white rounded-xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#19325C]/10"
              >
                {loadingId === record.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden text-lg"><Download className="w-5 h-5" /></span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Background Rendering for PDF */}
      {selectedRecord && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: 'none' }}>
            <div ref={documentRef} className="bg-white">
                {selectedRecord.slip_type === "premium" && (
                    <div className="w-[500px]">
                        <PremiumPlasticCard user={selectedRecord.user} qrCodeData={selectedRecord.user.qrCode} forwardedRef={documentRef} />
                    </div>
                )}
                {selectedRecord.slip_type === "improved" && (
                    <div className="w-[500px]">
                        <ImprovedNinSlip user={selectedRecord.user} qrCodeData={selectedRecord.user.qrCode} forwardedRef={documentRef} />
                    </div>
                )}
                {selectedRecord.slip_type === "regular" && (
                    <div className="w-[850px]">
                        <NinRegularSlip user={selectedRecord.user} forwardedRef={documentRef} />
                    </div>
                )}
            </div>
            
            <DownloadButton 
                templateRef={documentRef} 
                fileName={`NIN-Slip-${selectedRecord.user.nin || selectedRecord.identifier}`} 
                slipType={(selectedRecord.slip_type === "premium" || selectedRecord.slip_type === "improved") ? "plastic" : "full"} 
                renderCustom={({ onClick }) => (
                    <button ref={downloadBtnRef} onClick={onClick} className="hidden" />
                )}
            />
        </div>
      )}

      {/* Toast Notification System */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${
                toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 
                toast.type === 'loading' ? 'bg-white border-slate-100 text-[#19325C]' :
                'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
                {toast.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                {toast.type === 'success' && <ShieldCheck className="w-5 h-5" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                <span className="font-bold text-sm">{toast.message}</span>
            </div>
        </div>
      )}
    </div>
  );
}
