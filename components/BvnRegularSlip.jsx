"use client";

import React from "react";

export default function BvnRegularSlip({ user, forwardedRef }) {
    const formatBVN = (bvn) => {
        if (!bvn) return "";
        return bvn.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
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
            }).replace(/ /g, "-");
        } catch (e) {
            return dob;
        }
    };

    const DataRow = ({ label, value }) => (
        <div className="flex text-xs mb-4">
            <span className="font-bold w-36 whitespace-nowrap">{label}</span>
            <span className="uppercase ml-2 flex-1 break-words">{value || "—"}</span>
        </div>
    );

    return (
        <div className="flex justify-center p-4 bg-gray-50 min-h-screen">
            {/* The Slip Container */}
            <div 
                ref={forwardedRef}
                className="bg-white border border-gray-200 rounded shadow-sm w-full max-w-[850px] p-10 font-sans text-black"
                style={{
                    boxShadow: "0 0 10px rgba(0,0,0,0.05)",
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact"
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-center gap-6 mb-12">
                    {/* Coat of Arms (using generic fallback since not found in public folder, but typically client has it) */}
                    <img 
                        src="/coat_of_arms.png" 
                        crossOrigin="anonymous"
                        alt="Coat of Arms" 
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Coat_of_arms_of_Nigeria.svg/300px-Coat_of_arms_of_Nigeria.svg.png";
                        }}
                    />
                    <div className="flex flex-col text-center">
                        <h1 className="text-2xl font-bold text-[#2A2B5F] mb-1">Federal Republic of Nigeria</h1>
                        <h2 className="text-xl font-bold text-[#3B3C73]">Verified BVN Details</h2>
                    </div>
                </div>

                {/* Body Grid */}
                <div className="flex flex-row justify-between gap-8">
                    
                    {/* Left Column (Details) */}
                    <div className="flex-[0.8]">
                        <DataRow label="First Name:" value={user?.firstName} />
                        <DataRow label="Middle Name:" value={user?.middleName} />
                        <DataRow label="Last Name:" value={user?.lastName} />
                        <DataRow label="Date of birth:" value={formatDOB(user?.dob)} />
                        <DataRow label="Gender:" value={user?.gender} />
                        <DataRow label="Marital Status:" value={user?.maritalStatus || "SINGLE"} />
                        <DataRow label="Phone Number:" value={user?.phone || user?.phoneNumber || "07000000000"} />
                        <DataRow label="Enrollment Institution:" value="011" />
                        <DataRow label="Origin State:" value={user?.state || "KANO STATE"} />
                        <DataRow label="Residence State:" value={user?.state || "KANO STATE"} />
                        <DataRow label="Residential Address:" value={user?.address || "KANO NIGERIA"} />
                    </div>

                    {/* Middle Column (Photo & Secondary Details) */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="w-[120px] h-[140px] bg-gray-100 overflow-hidden mb-1 flex items-center justify-center border border-gray-300">
                            {user?.photo ? (
                                <img src={user.photo} crossOrigin="anonymous" className="w-full h-full object-cover" alt="User Photo" />
                            ) : (
                                <span className="text-gray-400 text-xs">No Photo</span>
                            )}
                        </div>
                        <div className="font-bold text-sm mb-1">BVN</div>
                        <div className="text-2xl font-black tracking-widest text-[#2A2B5F] mb-6">
                            {formatBVN(user?.bvn)}
                        </div>
                        
                        <div className="w-full flex text-xs mb-4">
                            <span className="font-bold">NIN: {user?.nin || "12345678901"}</span>
                        </div>

                        <div className="w-full">
                            <DataRow label="Enrollment Branch:" value="MAIN" />
                            <DataRow label="Origin LGA:" value={user?.lga || "KANO MUNICIPAL"} />
                            <DataRow label="Residence LGA:" value={user?.lga || "KANO MUNICIPAL"} />
                        </div>
                    </div>

                    {/* Right Column (Verified Notes) */}
                    <div className="flex-1 flex flex-col items-center pl-4">
                        <div className="text-3xl font-medium text-green-700 mb-6 tracking-wide">
                            Verified
                        </div>
                        <div className="text-[9px] leading-tight text-justify">
                            <p className="font-bold mb-2 text-center">Please do note that;</p>
                            <ol className="list-decimal pl-4 space-y-2 font-medium text-gray-800">
                                <li>The information on this slip remains valid until altered/modified where necessary by an authorized body.</li>
                                <li>Any person/authority using the information should verify it at anyverify.com.ng or any other channel approved by the federal government of Nigeria.</li>
                                <li>The information shown on this slip is valid for the lifetime of the holder and <span className="text-red-600 font-bold">DOES NOT EXPIRE</span>.</li>
                                <li>The Verifier should not be blamed for any unauthorized alteration/copy/erasure etc done on this slip.</li>
                            </ol>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
