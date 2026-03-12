"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function ImprovedNinSlip({ user, qrCodeData, forwardedRef }) {
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
        // Extract date components directly to ensure reliable formatting
        const date = new Date(dob);
        const day = String(date.getDate()).padStart(2, '0');
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const slipStyles = `
        .improved-slip-container {
            width: 450px;
            height: 280px;
            position: relative;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            -webkit-print-color-adjust: exact;
        }
        .improved-label {
            position: absolute;
            font-size: 9px;
            color: #555;
            font-weight: 700;
            z-index: 10;
        }
        .improved-value {
            position: absolute;
            font-size: 11px;
            color: #000;
            font-weight: 800;
            font-family: Arial, sans-serif;
            text-transform: uppercase;
            z-index: 10;
        }
    `;

    return (
        <div className="flex flex-col items-center">
            <style>{slipStyles}</style>
            <div 
                ref={forwardedRef}
                className="improved-slip-container"
            >
                {/* Background Image */}
                <img src="/improved_nin_slip.png" className="absolute inset-0 w-full h-full object-cover" alt="" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0">
                    {/* Header NGA */}
                    <div className="absolute top-[15px] right-[25px] text-[24px] font-black text-black opacity-80">NGA</div>

                    {/* Photo Placeholder/Space */}
                    <div className="absolute top-[70px] left-[25px] w-[85px] h-[105px] bg-slate-100 border border-slate-200 overflow-hidden z-10">
                        {user?.photo && <img src={user.photo} className="w-full h-full object-cover" alt="User" />}
                    </div>

                    {/* QR Code */}
                    <div className="absolute top-[185px] left-[25px] w-[50px] h-[50px] bg-white p-0.5 flex items-center justify-center z-10">
                        {qrImage && <img src={qrImage} className="w-full h-full object-contain" alt="QR" />}
                    </div>

                    {/* Fields based on improved_nin_slip.png layout */}
                    
                    {/* Surname */}
                    <div className="improved-label top-[75px] left-[125px]">Surname/Nom</div>
                    <div className="improved-value top-[90px] left-[125px] text-[13px]">{user?.lastName || ""}</div>

                    {/* Given Names */}
                    <div className="improved-label top-[115px] left-[125px]">Given Names/Prenoms</div>
                    <div className="improved-value top-[130px] left-[125px] text-[13px]">{user?.firstName || ""} {user?.middleName || ""}</div>

                    {/* Date of Birth */}
                    <div className="improved-label top-[155px] left-[125px]">Date of Birth</div>
                    <div className="improved-value top-[170px] left-[125px] text-[13px]">{formatDOB(user?.dob) || ""}</div>

                    {/* NIN Label and Value */}
                    <div className="absolute top-[215px] left-0 w-full text-center text-[11px] text-black font-bold uppercase z-10">
                        National Identification Number (NIN)
                    </div>
                    <div className="absolute top-[230px] left-0 w-full text-center text-[22px] font-black tracking-[0.1em] text-black z-10">
                        {formatNIN(user?.nin) || "0000 0000 000"}
                    </div>

                    {/* Footer text */}
                    <div className="absolute bottom-[8px] w-full text-center text-[8px] font-medium italic text-black opacity-80 px-4">
                        Kindly ensure you scan the barcode to verify the credentials
                    </div>
                </div>
            </div>
        </div>
    );
}
