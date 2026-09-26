"use client";

import React, { useEffect } from "react";
import GiftPickerBase from "./GiftPickerBase";
import socket from "../src/lib/socket";

const LUCKY_GIFTS = new Set([
  "Kiss", "Nut", "Mahjong", "Clover", "Charm", "Bouquet",
  "Leaves", "Crystal", "Candy", "Pop", "Scarecrow",
]);

function createLuckyGiftAnimationSrc(image: string) {
  const safeImage = String(image || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><image href="${safeImage}" x="5" y="-35" width="90" height="90"><animate attributeName="x" values="5;45" dur="1.1s" fill="freeze"/><animate attributeName="y" values="-35;45" dur="1.1s" fill="freeze"/><animate attributeName="width" values="90;10" dur="1.1s" fill="freeze"/><animate attributeName="height" values="90;10" dur="1.1s" fill="freeze"/><animate attributeName="opacity" values="1;0" dur="1.1s" fill="freeze"/></image></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function GiftPicker(props: any) {
  useEffect(() => {
    const originalEmit = socket.emit.bind(socket);
    const patchedEmit = ((event: string, ...args: any[]) => {
      if (event === "coin_transfer" && args[0] && LUCKY_GIFTS.has(String(args[0].giftName || ""))) {
        const data = args[0];
        const amount = Number(data.amount);
        const diamondAmount = Number.isFinite(amount) && amount > 0
          ? Math.floor(amount * 0.10)
          : 0;

        originalEmit("coin_transfer", {
          ...data,
          amount: diamondAmount,
        });

        const roomId = String(data.roomId || "");
        const senderId = String(data.senderId || "");
        const recipientIds = Array.isArray(data.recipientIds)
          ? new Set(data.recipientIds.map(String))
          : new Set<string>();
        const seats = Array.isArray(props.seats) ? props.seats : [];
        const image = String(data.giftImage || "");
        const animationSrc = createLuckyGiftAnimationSrc(image);
        const timestamp = Date.now();

        for (const seat of seats) {
          const targetId = String(seat?.user?.accountId || "");
          if (!seat?.isOccupied || !targetId || !recipientIds.has(targetId)) continue;

          originalEmit("room_seat_action", {
            roomId,
            userId: senderId,
            action: "emoji",
            seatNumber: Number(seat.number),
            src: animationSrc,
            timestamp,
            user: {
              name: "Lucky Gift",
              image,
              accountId: senderId,
            },
          });
        }

        return socket;
      }

      return originalEmit(event, ...args);
    }) as typeof socket.emit;

    (socket as any).emit = patchedEmit;
    return () => {
      (socket as any).emit = originalEmit;
    };
  }, [props.seats]);

  return <GiftPickerBase {...props} />;
}
