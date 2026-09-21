"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import Image from "next/image";

type GiftUser = {
  seatNumber: number;
  name: string;
  image: string;
  accountId: string;
};

type GiftPickerProps = {
  onClose: () => void;
  users?: GiftUser[];
  onSendGift?: (gift: {
    image: string;
    name: string;
    seatNumber: number;
    accountId: string;
  }) => void;
};

export default function GiftPicker({
  onClose,
  users = [],
  onSendGift,
}: GiftPickerProps) {
  const [activeTab, setActiveTab] = useState("Hot");
  const [selectedMultiplier, setSelectedMultiplier] = useState("1×");
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const tabs = ["Hot", "Lucky", "Luxury", "Event"];
  const multipliers = ["1×", "10×", "299×", "599×", "999×"];

  const hotGifts = [
    { id: 1, name: "Rose", coins: 10, image: "/IMG_20260815_103351.jpg" },
    { id: 2, name: "Heart", coins: 99, image: "/IMG_20260815_103351.jpg" },
    { id: 3, name: "Car", coins: 500, image: "/IMG_20260815_103351.jpg" },
    { id: 4, name: "Crown", coins: 1000, image: "/IMG_20260815_103351.jpg" },
    { id: 5, name: "Rocket", coins: 2000, image: "/IMG_20260815_103351.jpg" },
    { id: 6, name: "Castle", coins: 5000, image: "/IMG_20260815_103351.jpg" },
    { id: 7, name: "Diamond", coins: 10000, image: "/IMG_20260815_103351.jpg" },
    { id: 8, name: "Yacht", coins: 20000, image: "/IMG_20260815_103351.jpg" },
    { id: 9, name: "Plane", coins: 50000, image: "/IMG_20260815_103351.jpg" },
    { id: 10, name: "Island", coins: 100000, image: "/IMG_20260815_103351.jpg" },
    { id: 11, name: "Star", coins: 500000, image: "/IMG_20260815_103351.jpg" },
    { id: 12, name: "Galaxy", coins: 1000000, image: "/IMG_20260815_103351.jpg" },
  ];

  const luckyGifts = [
    { id: 101, name: "Kiss", coins: 1999, image: "/IMG_20260906_000443.png" },
    { id: 102, name: "Nut", coins: 3999, image: "/IMG_20260906_000508.png" },
    { id: 103, name: "Mahjong", coins: 5999, image: "/IMG_20260906_000521.png" },
    { id: 104, name: "Clover", coins: 4250, image: "/IMG_20260906_000541.png" },
    { id: 105, name: "Charm", coins: 7000, image: "/IMG_20260906_000624.png" },
    { id: 106, name: "Bouquet", coins: 10999, image: "/IMG_20260906_000643.png" },
    { id: 107, name: "Leaves", coins: 6799, image: "/IMG_20260906_000713.png" },
    { id: 108, name: "Crystal", coins: 2999, image: "/IMG_20260906_000756.png" },
    { id: 109, name: "Candy", coins: 15499, image: "/IMG_20260906_000814.png" },
    { id: 110, name: "Pop", coins: 4000, image: "/IMG_20260906_000832.png" },
    { id: 111, name: "Scarecrow", coins: 7500, image: "/IMG_20260906_000850.png" },
  ];

  const currentGifts = activeTab === "Lucky" ? luckyGifts : hotGifts;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSend = () => {
    if (selectedGift === null || !selectedUser) return;

    const receiver = users.find(
      (user) => user.accountId === selectedUser
    );

    const gift = currentGifts.find(
      (item) => item.id === selectedGift
    );

    if (!receiver || !gift) return;

    onSendGift?.({
      image: gift.image,
      name: gift.name,
      seatNumber: receiver.seatNumber,
      accountId: receiver.accountId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        ref={sheetRef}
        className="main-container h-[50vh] w-full max-w-md mx-auto text-white flex flex-col justify-between rounded-t-md border-t border-white/10 shadow-2xl relative px-4 pt-3 pb-2"
      >
        {/* SEATED USERS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 min-w-max">
              {users.length === 0 ? (
                <span className="text-xs text-gray-500 px-1">
                  No users on seats
                </span>
              ) : (
                users.map((user) => (
                  <button
                    key={`${user.accountId}-${user.seatNumber}`}
                    type="button"
                    onClick={() => setSelectedUser(user.accountId)}
                    className={`relative shrink-0 rounded-full p-[2px] transition-all ${
                      selectedUser === user.accountId
                        ? "ring-2 ring-blue-500 bg-blue-500"
                        : "border-2 border-transparent"
                    }`}
                  >
                    <img
                      src={user.image || "/default-avatar.png"}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                      draggable={false}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/default-avatar.png";
                      }}
                    />
                  </button>
                ))
              )}
            </div>
          </div>

          <span className="text-sm font-semibold text-gray-300 shrink-0">
            All
          </span>
        </div>

        <div className="flex items-center gap-1 py-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-semibold transition-all relative px-1 ${
                activeTab === tab
                  ? "text-white font-bold scale-105"
                  : "text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto py-2 grid grid-cols-4 gap-1 scrollbar-none">
          {currentGifts.map((gift) => (
            <div
              key={gift.id}
              onClick={() => setSelectedGift(gift.id)}
              className={`flex flex-col items-center justify-center border-2 border-transparent rounded-lg cursor-pointer p-1 ${
                selectedGift === gift.id
                  ? "border-blue-500 bg-blue-500/5"
                  : ""
              }`}
            >
              <div className="relative w-18 h-18 mb-0.5">
                <Image
                  src={gift.image}
                  alt={gift.name}
                  fill
                  className="object-contain"
                  sizes="72px"
                />
              </div>

              <span className="text-gray-300 font-medium text-[10px] truncate max-w-full">
                {gift.name}
              </span>

              <span className="text-yellow-400 text-[9px]">
                🪙 {gift.coins}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <div className="text-[10px] font-bold text-yellow-300">
            🪙 66457
          </div>

          <div className="flex items-center gap-1.5 relative">
            {showMultipliers && (
              <div className="absolute bottom-10 right-14 bg-zinc-900/95 border border-white/10 rounded-md p-1 flex flex-col gap-1 z-50">
                {multipliers.map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setSelectedMultiplier(num);
                      setShowMultipliers(false);
                    }}
                    className="px-2.5 py-0.5 text-xs rounded-md text-gray-300"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowMultipliers(!showMultipliers)}
              className="bg-white/5 border border-white/10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            >
              {selectedMultiplier}
              <ChevronUp className="w-3 h-3" />
            </button>

            <button
              onClick={handleSend}
              disabled={selectedGift === null || !selectedUser}
              className="bg-gradient-to-r from-blue-500 to-blue-700 disabled:opacity-40 text-white font-bold text-xs px-4 py-1.5 rounded-full"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-container {
          background: rgba(0, 0, 0, 0.95);
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
