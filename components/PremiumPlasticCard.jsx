"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function PremiumPlasticCard({ user, qrCodeData, forwardedRef }) {
    const [qrImage, setQrImage] = useState("");
    const [isFlipped, setIsFlipped] = useState(false);

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
        return new Date(dob).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).toUpperCase();
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
            perspective: 1000px;
            width: 450px;
            height: 280px;
            cursor: pointer;
            position: relative;
        }
        .premium-card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
        }
        .premium-card-container:hover .premium-card-inner, 
        .premium-card-inner.is-flipped {
            transform: rotateY(180deg);
        }
        .premium-card-front, .premium-card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            background-color: white;
            -webkit-print-color-adjust: exact;
        }
        .premium-card-back {
            transform: rotateY(180deg);
        }
        .premium-label {
            position: absolute;
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            z-index: 10;
        }
        .premium-value {
            position: absolute;
            font-size: 13px;
            color: #000;
            font-weight: 800;
            font-family: Arial, sans-serif;
            text-transform: uppercase;
            z-index: 10;
        }
    `;

    return (
        <div className="flex flex-col items-center">
            <style>{cardStyles}</style>
            <div 
                ref={forwardedRef}
                className="premium-card-container group" 
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`premium-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                    {/* Front of card */}
                    <div className="premium-card-front">
                        {/* Background SVG */}
                        <img src="/premium.svg" className="absolute inset-0 w-full h-full object-cover" alt="" />
                        
                        {/* Header Text (simulated) */}
                        <div className="absolute top-[18px] left-[150px] transform -translate-x-1/2 text-[12px] font-black text-[#006400] whitespace-nowrap">
                            FEDERAL REPUBLIC OF NIGERIA
                        </div>
                        <div className="absolute top-[32px] left-[100px] transform -translate-x-1/2 text-[10px] font-bold text-slate-800 uppercase tracking-tighter">
                            Digital NIN Slip
                        </div>

                        {/* Photo */}
                        <div className="absolute top-[75px] left-[30px] w-[90px] h-[110px] bg-slate-100 border border-slate-200 overflow-hidden">
                            {user?.photo && <img src={user.photo} className="w-full h-full object-cover" alt="User" />}
                        </div>

                        {/* QR Code */}
                        <div className="absolute top-[20px] right-[20px] w-[90px] h-[100px] bg-white p-1 flex items-center justify-center">
                            {qrImage && <img src={qrImage} className="w-full h-full object-contain" alt="QR" />}
                        </div>

                        {/* Data Fields */}
                        <div className="premium-label top-[85px] left-[140px]">Surname/Nom</div>
                        <div className="premium-value top-[100px] left-[140px]">{user?.lastName || "ADEBAYO"}</div>

                        <div className="premium-label top-[125px] left-[140px]">Given Names/Prenoms</div>
                        <div className="premium-value top-[140px] left-[140px]">{user?.firstName || "CHUKWUMA"} {user?.middleName || ""}</div>

                        <div className="premium-label top-[165px] left-[140px]">Date of Birth</div>
                        <div className="premium-value top-[180px] left-[140px]">{formatDOB(user?.dob) || "15 MAY 1990"}</div>

                        <div className="premium-label top-[165px] left-[230px]">Sex/Sexe</div>
                        <div className="premium-value top-[180px] left-[230px]">{user?.gender?.charAt(0) || "M"}</div>

                        <div className="premium-label top-[165px] right-[40px] text-[16px] font-black text-slate-400 opacity-50">NGA</div>

                        <div className="premium-label top-[185px] right-[40px] font-black text-[9px]">Issue Date</div>
                        <div className="premium-value top-[198px] right-[40px] text-[10px] whitespace-nowrap text-right">{formatIssueDate()}</div>

                        {/* NIN Display */}
                        <div className="absolute top-[215px] left-[140px] text-[10px] text-slate-500 font-bold uppercase z-10">National Identification Number (NIN)</div>
                        <div className="absolute top-[228px] left-[35px] text-[36px] font-black tracking-[0.2em] text-black z-10">
                            {formatNIN(user?.nin) || "0000 0000 000"}
                        </div>
                    </div>

                    {/* Back of card */}
                    <div className="premium-card-back">
                        <img src="/premiumback.svg" className="w-full h-full object-cover" alt="Card back" />
                    </div>
                </div>
                
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 animate-pulse group-hover:hidden">
                    Click card to flip
                </p>
            </div>
        </div>
    );
}
