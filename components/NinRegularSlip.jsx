"use client";

import React from "react";

export default function NinRegularSlip({ user, forwardedRef }) {
    return (
        <div className="flex justify-center p-4 bg-gray-50">
            {/* The Slip Container */}
            <div
                ref={forwardedRef}
                className="bg-white border-[3px] border-black w-full max-w-[850px] font-sans text-black"
                style={{
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact"
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-[3px] border-black">
                    <div className="w-[100px] flex justify-center">
                        {/* Coat of Arms */}
                        <img
                            src="/coat_of_arms.png"
                            alt="Coat of Arms"
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Coat_of_arms_of_Nigeria.svg/300px-Coat_of_arms_of_Nigeria.svg.png";
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <h1 className="text-2xl font-bold tracking-tight mb-1">National Identity Management System</h1>
                        <h2 className="text-lg font-semibold tracking-wide mb-1">Federal Republic of Nigeria</h2>
                        <h3 className="text-sm font-bold">National Identification Number Slip (NINS)</h3>
                    </div>
                    <div className="w-[100px] flex justify-center items-center">
                        {/* NIMC Logo Fallback */}
                        <img
                            src="/nimc_logo.png"
                            alt="NIMC Logo"
                            className="w-20 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <div className="hidden text-green-700 font-serif italic font-bold text-2xl tracking-tighter">NiMC</div>
                    </div>
                </div>

                {/* Body Grid - Two Column Layout */}
                <div className="flex border-b-[3px] border-black text-[11px] leading-tight">
                    {/* Left Data Column */}
                    <div className="flex-1 flex flex-col">
                        {/* Row 1 */}
                        <div className="flex border-b border-black">
                            <div className="w-[220px] border-r border-black p-2 flex items-center">
                                <span className="font-bold mr-2">TRACKING ID:</span>
                                <span className="uppercase">{user?.tracking_id || ""}</span>
                            </div>
                            <div className="w-[220px] border-r border-black p-2 flex items-center">
                                <span className="font-bold mr-2">Surname:</span>
                                <span className="uppercase">{user?.lastName || "YAURI"}</span>
                            </div>
                            <div className="flex-1 p-2">
                                <span className="block font-bold mb-1">Address:</span>
                                <div className="uppercase">
                                    {user?.residence_address || user?.address || "6 ALI BABAN GONA STREET NEW EXTENSION"}
                                </div>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="flex border-b border-black">
                            <div className="w-[220px] border-r border-black p-2 flex items-center">
                                <span className="font-bold mr-2">NIN:</span>
                                <span className="uppercase">{user?.nin || "87517739098"}</span>
                            </div>
                            <div className="w-[220px] border-r border-black p-2 flex items-center">
                                <span className="font-bold mr-2">First Name:</span>
                                <span className="uppercase">{user?.firstName || "MANNIR"}</span>
                            </div>
                            <div className="flex-1 p-2 uppercase flex items-end">
                                {user?.birthlga || user?.lga || "KAWO"}
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="flex border-b border-black">
                            <div className="w-[220px] border-r border-black p-2 flex items-center h-[35px]">
                                {/* Tracking id row has empty space here */}
                            </div>
                            <div className="w-[220px] border-r border-black p-2 flex items-center">
                                <span className="font-bold mr-2">Middle Name:</span>
                                <span className="uppercase">{user?.middleName || "BAWA"}</span>
                            </div>
                            <div className="flex-1 p-2 uppercase flex items-end">
                                {user?.birthstate || user?.state || "KD"}
                            </div>
                        </div>

                        {/* Row 4 */}
                        <div className="flex">
                            <div className="w-[220px] border-r border-black p-2 flex items-center h-[35px]">
                                {/* Tracking id row has empty space here */}
                            </div>
                            <div className="w-[220px] border-r border-black p-2 flex items-center">
                                <span className="font-bold mr-2">Gender:</span>
                                <span className="uppercase">{user?.gender?.charAt(0) || "M"}</span>
                            </div>
                            <div className="flex-1 p-2"></div>
                        </div>
                    </div>

                    {/* Right Photo Column */}
                    <div className="w-[140px] border-l border-black flex items-start justify-center p-1 bg-gray-100" style={{ height: "160px" }}>
                        {user?.photo ? (
                            <img src={user.photo} className="w-full h-full object-cover" alt="User Photo" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Photo</div>
                        )}
                    </div>
                </div>

                {/* Notice Block */}
                <div className="p-2 border-b-[3px] border-black text-[11px]">
                    <p className="mb-1 text-justify">
                        <span className="font-bold">Note:</span> The <span className="font-bold italic">National Identification Number (NIN) is your identity</span>. It is confidential and may only be released for legitimate transactions.
                    </p>
                    <p>
                        You will be notified when your National Identity Card is ready (for any enquiries please contact)
                    </p>
                </div>

                {/* Footer / Contact Block */}
                <div className="flex text-[9px] font-bold text-center">
                    <div className="flex-1 border-r border-black p-2 flex flex-col items-center justify-center">
                        {/* Fake icon */}
                        <div className="w-5 h-4 bg-blue-900 rounded-sm mb-1 opacity-80" style={{ borderRadius: '40% 40% 10% 10%' }}></div>
                        <div>helpdesk@nimc.gov.ng</div>
                    </div>
                    <div className="flex-1 border-r border-black p-2 flex flex-col items-center justify-center">
                        {/* Fake icon */}
                        <div className="w-5 h-5 rounded-full bg-blue-500 mb-1 opacity-80 flex items-center justify-center">
                            <div className="text-yellow-300 font-serif italic text-[10px] leading-none">e</div>
                        </div>
                        <div>www.nimc.gov.ng</div>
                    </div>
                    <div className="flex-1 border-r border-black p-2 flex flex-col items-center justify-center">
                        {/* Fake icon */}
                        <div className="w-5 h-5 rounded-md bg-green-500 mb-1 opacity-80 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white rounded-bl-full border-t-0 border-r-0 transform rotate-45 translate-x-[1px] -translate-y-[1px]"></div>
                        </div>
                        <div>0700-CALL-NIMC</div>
                        <div className="text-[8px] mt-0.5">(0700-2255-646)</div>
                    </div>
                    <div className="flex-[1.5] p-2 flex flex-col items-center justify-center">
                        {/* Fake icon */}
                        <div className="flex mb-1 opacity-80 gap-0.5">
                            <div className="w-2 h-3 bg-red-500 rounded-sm"></div>
                            <div className="w-2 h-3 bg-green-500 rounded-sm"></div>
                        </div>
                        <div className="mb-0.5">National Identity Management Commission</div>
                        <div className="font-normal text-[8px] leading-[1.2]">11, Sokode Crescent, Off Dalaba Street, Zone 5 Wuse, Abuja Nigeria</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
