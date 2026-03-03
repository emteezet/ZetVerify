"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function PremiumPlasticCard({ userData, qrCodeData, forwardedRef }) {
    const [qrImage, setQrImage] = useState("");

    useEffect(() => {
        const generateQR = async () => {
            if (qrCodeData || userData?.nin) {
                try {
                    const qrDataUrl = await QRCode.toDataURL(qrCodeData || `NIN:${userData?.nin}`, {
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
    }, [qrCodeData, userData]);

    const formatNIN = (nin) => {
        if (!nin) return "";
        return nin.replace(/(\d{4})(\d{4})(\d{3})/g, "$1 $2 $3");
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

    const fullName = [userData?.firstName, userData?.middleName].filter(Boolean).join(" ");

    return (
        <div
            ref={forwardedRef}
            className="flex flex-col items-center justify-center w-full"
        >
            <div
                id="premium-slip-template"
                className="relative shadow-xl overflow-hidden font-sans"
                style={{
                    width: "100%",
                    maxWidth: "800px",      // Arbitrary responsive max width
                    aspectRatio: "545.85 / 165.74", // The exact ratio of front and back combined
                    backgroundColor: "#fff",
                }}
            >
                {/* The Base SVG Background Image */}
                <img
                    src="/NIN-Premium Plastic.svg"
                    alt="Premium Plastic NIN Template"
                    className="absolute max-w-none pointer-events-none"
                    style={{
                        // Scale and shift the original SVG so the two cards perfectly fill the container
                        // Original SVG viewBox 0 0 595.28 841.89
                        // Target Box: x: 35.87, y: 26.81, w: 510, h: 165.74
                        width: `${(595.28 / 510) * 100}%`,
                        top: `${-(26.81 / 165.74) * 100}%`,
                        left: `${-(35.87 / 510) * 100}%`,
                    }}
                />

                {/* --- FRONT CARD OVERLAYS --- */}
                {/* Width of front card is half of total width: 50% */}
                <div className="absolute top-0 left-0 w-1/2 h-full z-10">

                    {/* USER PHOTO */}
                    <div
                        className="absolute rounded overflow-hidden shadow-sm"
                        style={{
                            top: '28%', left: '4%', width: '22%', height: '48%',
                            backgroundColor: 'rgba(255,255,255,0.7)'
                        }}
                    >
                        <img
                            src={userData?.photo || "/placeholder-user.jpg"}
                            alt="User"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "/placeholder-user.jpg"; }}
                        />
                    </div>

                    {/* QR CODE */}
                    {qrImage && (
                        <div
                            className="absolute bg-white p-1 rounded shadow-sm flex items-center justify-center"
                            style={{
                                top: '11%', left: '72%', width: '24%', aspectRatio: '1/1'
                            }}
                        >
                            <img src={qrImage} alt="QR Code" className="w-full h-full object-contain" />
                        </div>
                    )}

                    {/* DYNAMIC TEXT FIELDS */}

                    {/* SURNAME */}
                    <div className="absolute text-black font-bold uppercase tracking-wider" style={{ top: '35%', left: '30%', fontSize: '1.8cqw' }}>
                        {userData?.lastName || "---"}
                    </div>

                    {/* GIVEN NAMES */}
                    <div className="absolute text-black font-bold uppercase tracking-wider" style={{ top: '50%', left: '30%', fontSize: '1.8cqw' }}>
                        {fullName || "---"}
                    </div>

                    {/* NATIONALITY */}
                    <div className="absolute text-black font-black tracking-widest text-[#2f3583]" style={{ top: '48%', left: '80%', fontSize: '2cqw', color: '#131e5d' }}>
                        NGA
                    </div>

                    {/* DATE OF BIRTH */}
                    <div className="absolute text-black font-bold uppercase tracking-wider" style={{ top: '65%', left: '30%', fontSize: '1.3cqw' }}>
                        {formatDOB(userData?.dob)}
                    </div>

                    {/* SEX */}
                    <div className="absolute text-black font-bold uppercase tracking-wider" style={{ top: '65%', left: '55%', fontSize: '1.3cqw' }}>
                        {userData?.gender === "MALE" ? "MALE" : userData?.gender === "FEMALE" ? "FEMALE" : "-"}
                    </div>

                    {/* ISSUE DATE */}
                    <div className="absolute text-black font-bold uppercase tracking-wider" style={{ top: '65%', left: '72%', fontSize: '1.3cqw' }}>
                        {formatIssueDate()}
                    </div>

                    {/* NIN */}
                    <div className="absolute text-black font-black tracking-widest" style={{ top: '82%', left: '20%', fontSize: '3.5cqw' }}>
                        {formatNIN(userData?.nin) || "0000 000 0000"}
                    </div>

                </div>

                {/* --- BACK CARD OVERLAYS --- */}
                {/* Width of back card is the right half: 50% */}
                <div className="absolute top-0 right-0 w-1/2 h-full z-10">

                    {/* Usually the serial number/tracking ID is at the bottom right or back. If it's missing in the picture, we skip or add it. */}

                </div>
            </div>
        </div>
    );
}
