"use client";

import React, { useState } from "react";

export default function PlasticBvn({ user, forwardedRef }) {


    const formatBVN = (bvn) => {
        if (!bvn) return "";
        return bvn.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
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
                        <img src="/BVN--front.png" className="absolute inset-0 w-full h-full object-cover" alt="" />

                        {/* Conditional Wrapper for Data: Hides content manually when flipped to prevent mobile 'ghosting' */}
                        <div className="absolute inset-0">
                            {/* Photo */}
                            <div className="absolute top-[90px] left-[30px] w-[90px] h-[110px] bg-slate-100 border border-slate-200 overflow-hidden z-10" style={{ backfaceVisibility: 'hidden' }}>
                                {user?.photo && <img src={user.photo} crossOrigin="anonymous" className="w-full h-full object-cover" alt="User" />}
                            </div>

                            {/* Data Fields */}
                            <div className="premium-value top-[100px] left-[140px]">{user?.lastName || ""}</div>

                            <div className="premium-value top-[150px] left-[140px]">{user?.firstName || ""}, {user?.middleName || ""}</div>

                            <div className="premium-value top-[190px] left-[140px]">{formatDOB(user?.dob) || ""}</div>

                            <div className="premium-value top-[190px] left-[260px]">{user?.gender?.charAt(0) || ""}</div>

                            <div className="premium-value top-[188px] right-[10] text-[10px] font-light whitespace-nowrap text-right">{formatIssueDate()}</div>

                            {/* BVN Display */}
                            <div className="absolute top-[228px] left-0 w-full text-center text-[36px] font-black tracking-[0.2em] text-black z-10" style={{ backfaceVisibility: 'hidden' }}>
                                {formatBVN(user?.bvn) || "0000 0000 000"}
                            </div>
                        </div>
                    </div>

                    {/* Back of card */}
                    <div className="premium-card-back">
                        <img src="/BVN--back.png" className="w-full h-full object-cover" alt="Card back" />
                    </div>
                </div>
            </div>
        </div>
    );
}
