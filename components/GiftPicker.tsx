"use client";

import React, { useEffect } from "react";
import GiftPickerBase from "./GiftPickerBase";
import socket from "../src/lib/socket";

const LUCKY_GIFT_IMAGES: Record<string, string> = {
  Kiss: "/IMG_20260906_000443.png",
  Nut: "/IMG_20260906_000508.png",
  Mahjong: "/IMG_20260906_000521.png",
  Clover: "/IMG_20260906_000541.png",
  Charm: "/IMG_20260906_000624.png",
  Bouquet: "/IMG_20260906_000643.png",
  Leaves: "/IMG_20260906_000713.png",
  Crystal: "/IMG_20260906_000756.png",
  Candy: "/IMG_20260906_000814.png",
  Pop: "/IMG_20260906_000832.png",
  Scarecrow: "/IMG_20260906_000850.png",
};

export default function GiftPicker(props: any) {
  useEffect(() => {
    const originalEmit = socket.emit.bind(socket);

    const patchedEmit = ((event: string, ...args: any[]) => {
      if (event !== "coin_transfer" || !args[0]) {
        return originalEmit(event, ...args);
      }

      const data = { ...args[0] };
      const image = LUCKY_GIFT_IMAGES[String(data.giftName || "")];

      if (!image) return originalEmit(event, ...args);

      const amount = Number(data.amount);
      const diamondAmount =
        Number.isFinite(amount) && amount > 0 ? Math.floor(amount * 0.1) : 0;

      originalEmit("coin_transfer", {
        ...data,
        luckyGift: true,
        luckyImage: image,
        diamondAmount,
      });

      const recipientIds = new Set(
        Array.isArray(data.recipientIds) ? data.recipientIds.map(String) : []
      );

      for (const seat of Array.isArray(props.seats) ? props.seats : []) {
        const targetId = String(seat?.user?.accountId || "");
        if (!seat?.isOccupied || !targetId || !recipientIds.has(targetId))
          continue;

        const luckyEvent = {
          eventId: `lucky-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          roomId: String(data.roomId || ""),
          userId: String(data.senderId || ""),
          action: "lucky_image",
          seatNumber: Number(seat.number),
          src: image,
          timestamp: Date.now(),
          duration: 1100,
          luckyGift: true,
          targetName: String(seat.user?.name || ""),
          user: {
            name: "Lucky Gift",
            image,
            accountId: targetId,
          },
        };

        // Play immediately on the sender too; the server also relays the same event to the room.
        window.dispatchEvent(new CustomEvent("hurry:lucky-image", { detail: luckyEvent }));
        originalEmit("room_seat_action", luckyEvent);
}

      return socket;
    }) as typeof socket.emit;

    (socket as any).emit = patchedEmit;
    return () => {
      (socket as any).emit = originalEmit;
    };
  }, [props.seats]);

  return <GiftPickerBase {...props} />;
}
