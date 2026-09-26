"use client";

import React, { useEffect, useRef, useState } from "react";
import socket from "../src/lib/socket";

type LuckyNotice = {
  id: string;
  senderName: string;
  senderImage: string;
  recipientName: string;
  giftImage: string;
  multiplier: number;
  returnAmount: number;
  returnPercent: number;
};

export default function LuckyGiftNotificationSlider({ roomId }: { roomId: string }) {
  const [notice, setNotice] = useState<LuckyNotice | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (data: any = {}) => {
      if (String(data.roomId || "") !== String(roomId || "")) return;
      if (data.luckyGift !== true) return;

      const next: LuckyNotice = {
        id: String(data.transferId || data.eventId || `notify-${Date.now()}-${Math.random()}`),
        senderName: String(data.senderName || "User"),
        senderImage: String(data.senderImage || "/default-avatar.png"),
        recipientName: String(data.recipientName || "User"),
        giftImage: String(data.luckyImage || data.giftImage || ""),
        multiplier: Math.max(1, Number(data.multiplier) || 1),
        returnAmount: Math.max(0, Number(data.luckyReturnAmount) || 0),
        returnPercent: Math.max(0, Number(data.luckyReturnPercent) || 0),
      };

      setNotice(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setNotice(null), 3600);
    };

    socket.on("coin_transfer_received", handler);
    return () => {
      socket.off("coin_transfer_received", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [roomId]);

  if (!notice) return null;

  return (
    <div
      key={notice.id}
      className="fixed left-2 right-2 z-[2147483000] pointer-events-none flex justify-center"
      style={{ bottom: "20vh" }}
    >
      <div
        className="relative w-[min(94vw,420px)] h-[72px] overflow-hidden"
        style={{
          backgroundImage: "url('/file_000000006f008211bade0d2ed6277792.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          animation: "hurryLuckyNoticeSlide 3.6s ease-in-out forwards",
        }}
      >
        <div className="absolute left-[9px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full overflow-hidden">
          <img src={notice.senderImage} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>

        <div className="absolute left-[56px] top-1/2 -translate-y-1/2 min-w-0 max-w-[46%] text-white">
          <div className="font-bold text-[12px] truncate">{notice.senderName}</div>
          <div className="text-[10px] text-white/80 truncate">Sent to {notice.recipientName}</div>
        </div>

        <div className="absolute right-[7px] top-1/2 -translate-y-1/2 w-[56px] h-[56px]">
          <img
            src="/file_00000000a9e48211aee262c0df0c36bc.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          {notice.giftImage && (
            <img
              src={notice.giftImage}
              alt=""
              className="absolute left-1/2 top-1/2 w-[32px] h-[32px] -translate-x-1/2 -translate-y-1/2 object-contain"
              draggable={false}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-[11px] drop-shadow-md">
            +{notice.returnAmount.toLocaleString()}
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-extrabold text-[15px] drop-shadow-md">
          ×{notice.multiplier}
        </div>
      </div>

      <style jsx>{`
        @keyframes hurryLuckyNoticeSlide {
          0% { transform: translate3d(115vw, 0, 0); opacity: 0; }
          12% { transform: translate3d(0, 0, 0); opacity: 1; }
          78% { transform: translate3d(0, 0, 0); opacity: 1; }
          100% { transform: translate3d(-115vw, 0, 0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
