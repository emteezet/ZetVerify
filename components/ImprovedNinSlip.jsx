"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function ImprovedNinSlip({ user, qrCodeData, forwardedRef }) {
    const [qrImage, setQrImage] = useState("");

    useEffect(() => {
        const generateQR = async () => {
            if (user?.nin) {
                try {
                    const fullName = `${user.firstName || ""} ${user.middleName ? user.middleName + " " : ""}${user.lastName || ""}`.trim().toUpperCase();
                    const qrText = `NAME: ${fullName}\nNIN: ${user.nin}\nDOB: ${user.dob || ""}`;

                    const qrDataUrl = await QRCode.toDataURL(qrText, {
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
        return nin.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
    };

    const formatDOB = (dob) => {
        if (!dob) return "";
        try {
            const normalized = dob.includes('-') && dob.split('-')[0].length === 2
                ? dob.split('-').reverse().join('-')
                : dob;

            const date = new Date(normalized);
            if (isNaN(date.getTime())) return dob;

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
        .improved-card-container {
            width: 450px;
            height: 280px;
            position: relative;
            user-select: none;
            -webkit-user-select: none;
        }
        .improved-card-inner {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .premium-card-front, .premium-card-back {
            position: absolute;
            width: 450px; /* Use explicit width for clones */
            height: 280px; /* Use explicit height for clones */
            border-radius: 0px;
            border:1px solid black;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            background-color: white;
            -webkit-print-color-adjust: exact;
        }
        .premium-card-back {
            display: none; 
            top: 0;
            left: 0;
        }
        .improved-value {
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
        <div className="flex flex-col items-center" ref={forwardedRef}>
            <style>{cardStyles}</style>
            <div
                className="improved-card-container"
            >
                <div className="improved-card-inner">
                    {/* Front of card */}
                    <div className="premium-card-front">
                        {/* Background Image */}
                        <img src="/improved_nin_slip.png" className="absolute inset-0 w-full h-full object-cover" alt="" />

                        <div className="absolute inset-0">
                            {/* Header Text - Precise positioning to match background template */}


                            {/* Photo - Centered in frame */}
                            <div className="absolute top-[85px] left-[22px] w-[88px] h-[112px] border-[1px] border-black bg-transparent overflow-hidden z-10">
                                {user?.photo && <img src={user.photo} crossOrigin="anonymous" className="w-full h-full object-cover" alt="User" />}
                            </div>

                            {/* QR Code - Top Right alignment */}
                            <div className="absolute top-[45px] right-[25px] w-[75px] h-[75px] bg-white p-1 flex items-center justify-center z-10">
                                {qrImage && <img src={qrImage} crossOrigin="anonymous" className="w-full h-full object-cover" alt="QR" />}
                            </div>

                            {/* Data Values Only - Aligned to pre-printed labels */}
                            <div className="improved-value top-[82px] left-[115px]">{user?.lastName || ""}</div>

                            <div className="improved-value top-[122px] left-[115px]">{user?.firstName || ""}, {user?.middleName || ""}</div>

                            <div className="improved-value top-[162px] left-[115px]">{formatDOB(user?.dob) || ""}</div>

                            <div className="improved-value top-[162px] left-[265px]">{user?.gender?.charAt(0) || ""}</div>



                            {/* NIN Display - Smaller font to fit and avoid overlap */}

                            <div className="absolute top-[220px] left-0 w-full text-center text-[30px] font-black tracking-[0.15em] text-black z-10">
                                {formatNIN(user?.nin) || "0000 0000 000"}
                            </div>
                        </div>
                    </div>

                    {/* Back of card */}
                    <div className="premium-card-back">
                        <img src="/premiumback.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Card back" />
                    </div>
                </div>
            </div>
        </div>
    );
}
