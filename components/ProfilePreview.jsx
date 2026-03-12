import { useState, useEffect } from "react";
import { Fingerprint, Info, Download, Loader2, CheckCircle } from "lucide-react";

export default function ProfilePreview({ 
    user, 
    idType = "NIN", 
    idNumber = "", 
    onDownload, 
    isDownloading = false,
    error = ""
}) {
    const [showSuccess, setShowSuccess] = useState(false);

    // Watch for transition from downloading to not downloading (success)
    const [prevDownloading, setPrevDownloading] = useState(false);
    useEffect(() => {
        if (prevDownloading && !isDownloading && !error) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
        setPrevDownloading(isDownloading);
    }, [isDownloading, error]);
    // Safely format the ID number (masks all but last 4 digits)
    const formatId = (id) => {
        if (!id || id.length < 4) return id || "***";
        const visibleDigits = id.slice(-4);
        const maskedSection = '*'.repeat(id.length - 4);
        return `${maskedSection}${visibleDigits}`;
    };

    // Combine names
    const fullName = [user?.firstName, user?.middleName, user?.lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/_/g, ' ') || "Loading...";

    const dob = user?.dob || "N/A";
    const gender = (user?.gender || "N/A").replace('EXAMPLE_', '');
    const phone = user?.phone || user?.telephoneno || "N/A";
    
    // Address Info
    const address = [user?.address || user?.residence_address || user?.residence]
        .filter(Boolean)
        .join(", ")
        .replace(/EXAMPLE_/g, '')
        .replace(/_RESIDENT/g, '') || "N/A";

    const stateOrigin = (user?.state || user?.birthstate || "N/A").replace('EXAMPLE_', '');
    const lgaOrigin = (user?.lga || user?.birthlga || "N/A").replace('EXAMPLE_', '');
    const photoUrl = user?.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";

    return (
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md overflow-hidden border border-gray-100 mx-auto">
            {/* Header / Photo Area */}
            <div className="px-6 pt-8 pb-16 text-center relative" style={{ background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)" }}>
                <h1 className="text-white text-[11px] font-bold opacity-90 mb-4 tracking-[0.2em] uppercase">Identity Preview</h1>
                <img 
                    src={photoUrl} 
                    alt="Profile Photo" 
                    className="w-28 h-28 rounded-full border-4 border-white shadow-md absolute left-1/2 transform -translate-x-1/2 -bottom-14 object-cover bg-gray-200" 
                />
            </div>

            {/* Details Area */}
            <div className="px-8 pt-20 pb-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight break-words font-outfit">{fullName}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1 text-gray-500">
                        <Fingerprint className="w-4 h-4" />
                        <p className="text-sm font-medium tracking-widest font-mono">{idType}: {formatId(idNumber)}</p>
                    </div>
                </div>

                {/* Essential Info Grid */}
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Date of Birth</p>
                        <p className="text-sm font-semibold text-gray-800">{dob}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Gender</p>
                        <p className="text-sm font-semibold text-gray-800">{gender}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Phone Number</p>
                        <p className="text-sm font-semibold text-gray-800">{phone}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">State / Region</p>
                        <p className="text-sm font-semibold text-gray-800">{stateOrigin}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">LGA of Origin</p>
                        <p className="text-sm font-semibold text-gray-800">{lgaOrigin}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Address</p>
                        <p className="text-sm font-semibold text-gray-800">{address}</p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-slate-50/80 rounded-xl p-4 mb-8 flex items-start gap-3 text-slate-600 border border-slate-100">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
                    <p className="text-xs leading-relaxed">
                        This is a summarized preview. Your full address, birth history, and complete biographical details are automatically included in the downloaded high-quality PDF.
                    </p>
                </div>

                {/* Action Button */}
                <button 
                    onClick={onDownload}
                    disabled={isDownloading}
                    className="w-full text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
                    style={{ 
                        background: isDownloading ? "#94a3b8" : "linear-gradient(135deg, #0d6b0d, #1a8c1a)",
                        cursor: isDownloading ? "not-allowed" : "pointer"
                    }}
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            <span>Download Complete PDF</span>
                        </>
                    )}
                </button>
                
                {showSuccess && (
                    <div className="text-center mt-4 text-green-600 text-sm font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="w-4 h-4" />
                        PDF Download Started!
                    </div>
                )}
                
                {error && (
                    <div className="text-center mt-4 text-red-500 text-xs font-bold flex items-center justify-center gap-2 bg-red-50 py-2 rounded-lg">
                        <Info className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
