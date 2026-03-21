"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function PremiumPlasticCard({ user, qrCodeData, forwardedRef }) {
    const [qrImage, setQrImage] = useState("");

    useEffect(() => {
        const generateQR = async () => {
            if (qrCodeData || user?.nin) {
                try {
                    const qrDataUrl = await QRCode.toDataURL(qrCodeData || `NIN:${user?.nin}`, {
                        width: 150,
                        margin: 0,
                        color: {
                            dark: "#000000",
                            light: "#ffffff",
                        },
                    });
                    setQrImage(qrDataUrl);
                } catch (err) {
                    console.error("QR Code generation error:", err);
                }
            }
        };
        generateQR();
    }, [qrCodeData, user]);

    const formatNIN = (nin) => {
        if (!nin) return "";
        return nin.replace(/(\d{4})(\d{4})(\d{3})/, "$1 $2 $3");
    };

    const formatDOB = (dob) => {
        if (!dob) return "";
        try {
            // Normalize DD-MM-YYYY to DD/MM/YYYY for Safari/Mobile compatibility if needed
            const normalized = dob.includes('-') && dob.split('-')[0].length === 2 
                ? dob.split('-').reverse().join('-') // Try to flip to YYYY-MM-DD
                : dob;
                
            const date = new Date(normalized);
            if (isNaN(date.getTime())) return dob; // Fallback to raw string if parsing fails
            
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).toUpperCase();
        } catch (e) {
            return dob;
        }
    };

    const formatIssueDate = () => {
        return new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).toUpperCase();
    };

    const cardStyles = `
        .premium-card-container {
            width: 450px;
            height: 280px;
            position: relative;
            user-select: none;
            -webkit-user-select: none;
        }
        .premium-card-inner {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .premium-card-front, .premium-card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 0px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            background-color: white;
            -webkit-print-color-adjust: exact;
        }
        .premium-card-back {
            display: none; /* Hidden on screen, will be shown manually by logic if needed */
        }
        .premium-label {
            position: absolute;
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            z-index: 10;
            backface-visibility: hidden;
            transform: translateZ(1px);
        }
        .premium-value {
            position: absolute;
            font-size: 13px;
            color: #000;
            font-weight: 800;
            font-family: Arial, sans-serif;
            text-transform: uppercase;
            z-index: 10;
            backface-visibility: hidden;
            transform: translateZ(1px);
        }
    `;

    return (
        <div className="flex flex-col items-center">
            <style>{cardStyles}</style>
            <div
                ref={forwardedRef}
                className="premium-card-container"
            >
                <div className="premium-card-inner">
                    {/* Front of card */}
                    <div className="premium-card-front">
                        {/* Background SVG - Always visible on front */}
                        <img src="/premium.jpg" className="absolute inset-0 w-full h-full object-cover" alt="" />

                        {/* Conditional Wrapper for Data: Hides content manually when flipped to prevent mobile 'ghosting' */}
                        <div className="absolute inset-0">
                            {/* Header Text (simulated) */}
                            <div className="absolute top-[18px] left-[150px] transform -translate-x-1/2 text-[15px] font-black text-[#006400] whitespace-nowrap z-10" style={{ backfaceVisibility: 'hidden' }}>
                                FEDERAL REPUBLIC OF NIGERIA
                            </div>
                            <div className="absolute top-[35px] left-[95px] transform -translate-x-1/2 text-[13px] font-bold text-slate-800 uppercase tracking-tighter z-10" style={{ backfaceVisibility: 'hidden' }}>
                                Digital NIN Slip
                            </div>

                            {/* Photo */}
                            <div className="absolute top-[75px] left-[30px] w-[90px] h-[110px] bg-slate-100 border border-slate-200 overflow-hidden z-10" style={{ backfaceVisibility: 'hidden' }}>
                                {user?.photo && <img src={user.photo} crossOrigin="anonymous" className="w-full h-full object-cover" alt="User" />}
                            </div>

                            {/* QR Code */}
                            <div className="absolute top-[20px] right-[20px] w-[90px] h-[100px] bg-white p-1 flex items-center justify-center z-10" style={{ backfaceVisibility: 'hidden' }}>
                                {qrImage && <img src={qrImage} crossOrigin="anonymous" className="w-full h-full object-contain" alt="QR" />}
                            </div>

                            {/* Data Fields */}
                            <div className="premium-label top-[85px] left-[140px]">Surname/Nom</div>
                            <div className="premium-value top-[100px] left-[140px]">{user?.lastName || ""}</div>

                            <div className="premium-label top-[125px] left-[140px]">Given Names/Prenoms</div>
                            <div className="premium-value top-[140px] left-[140px]">{user?.firstName || ""}, {user?.middleName || ""}</div>

                            <div className="premium-label top-[165px] left-[140px]">Date of Birth</div>
                            <div className="premium-value top-[180px] left-[140px]">{formatDOB(user?.dob) || ""}</div>

                            <div className="premium-label top-[165px] left-[260px]">Sex/Sexe</div>
                            <div className="premium-value top-[180px] left-[260px]">{user?.gender?.charAt(0) || ""}</div>

                            <div className="premium-label top-[165px] right-[40px] text-[16px] font-black text-slate-400 opacity-50">NGA</div>

                            <div className="premium-label top-[175px] right-[40px] font-bold text-[10px]">Issue Date</div>
                            <div className="premium-value top-[188px] right-[40px] text-[10px] font-light whitespace-nowrap text-right">{formatIssueDate()}</div>

                            {/* NIN Display */}
                            <div className="absolute top-[215px] left-0 w-full text-center text-[10px] text-slate-500 font-bold uppercase z-10" style={{ backfaceVisibility: 'hidden' }}>National Identification Number (NIN)</div>
                            <div className="absolute top-[228px] left-0 w-full text-center text-[36px] font-black tracking-[0.2em] text-black z-10" style={{ backfaceVisibility: 'hidden' }}>
                                {formatNIN(user?.nin) || "0000 0000 000"}
                            </div>
                        </div>
                    </div>

                    {/* Back of card */}
                    <div className="premium-card-back">
                        <img src="/premiumback.jpg" className="w-full h-full border-[1px] border-black-200 object-cover" alt="Card back" />
                    </div>
                </div>
            </div>
        </div>
    );
}
