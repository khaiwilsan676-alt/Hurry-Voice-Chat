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

function findTargetAvatar(accountId: string, name: string): HTMLImageElement | null {
  if (name) {
    const escaped =
      typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(name)
        : name.replace(/["\\]/g, "\\$&");
    const byName = document.querySelector(`img[alt="${escaped}"]`) as HTMLImageElement | null;
    if (byName) return byName;
  }

  const seats = Array.from(document.querySelectorAll("img[alt]")) as HTMLImageElement[];
  for (const img of seats) {
    const parentText = img.parentElement?.parentElement?.textContent || "";
    if (accountId && parentText.includes(accountId)) return img;
  }

  return null;
}

function playLuckyGiftFly(data: any) {
  if (typeof window === "undefined" || data?.action !== "lucky_image") return;

  const image = String(data.src || "");
  if (!image) return;

  const targetAccountId = String(data.user?.accountId || "");
  const targetName = String(data.targetName || data.user?.name || "");

  let attempts = 0;
  const findAndAnimate = () => {
    const target = findTargetAvatar(targetAccountId, targetName);

    if (!target && attempts++ < 12) {
      window.setTimeout(findAndAnimate, 80);
      return;
    }
    if (!target) return;

    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const flyer = document.createElement("img");
    flyer.src = image;
    flyer.alt = "";
    flyer.setAttribute("aria-hidden", "true");
    flyer.draggable = false;

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight + 45;
    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;

    Object.assign(flyer.style, {
      position: "fixed",
      left: `${startX}px`,
      top: `${startY}px`,
      width: "82px",
      height: "82px",
      objectFit: "contain",
      pointerEvents: "none",
      userSelect: "none",
      zIndex: "2147483647",
      transform: "translate(-50%, -50%)",
    });

    document.body.appendChild(flyer);

    const animation = flyer.animate(
      [
        {
          transform: "translate(-50%, -50%) scale(1)",
          width: "82px",
          height: "82px",
          opacity: 1,
        },
        {
          transform: `translate(calc(-50% + ${endX - startX}px), calc(-50% + ${endY - startY}px)) scale(1)`,
          width: "18px",
          height: "18px",
          opacity: 0,
        },
      ],
      {
        duration: Number(data.duration) > 0 ? Number(data.duration) : 1100,
        easing: "cubic-bezier(0.18,0.72,0.32,1)",
        fill: "forwards",
      }
    );

    animation.onfinish = () => flyer.remove();
  };

  requestAnimationFrame(findAndAnimate);
}

if (typeof window !== "undefined") {
  const key = "__hurryLuckyGiftFlyListener";
  const win = window as typeof window & { [key: string]: boolean };

  if (!win[key]) {
    win[key] = true;
    socket.on("room_seat_action", playLuckyGiftFly);
  }
}

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

      // Preserve the original coin value. Lucky receiver reward is 10% Diamonds.
      originalEmit("coin_transfer", {
        ...data,
        luckyGift: true,
        luckyImage: image,
        diamondAmount,
      });

      const recipientIds = new Set(
        Array.isArray(data.recipientIds) ? data.recipientIds.map(String) : []
      );

      // Play the fly immediately on this device; the backend separately relays it to other room users.
      for (const seat of Array.isArray(props.seats) ? props.seats : []) {
        const targetId = String(seat?.user?.accountId || "");
        if (!seat?.isOccupied || !targetId || !recipientIds.has(targetId)) continue;

        const luckyEvent = {
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
        originalEmit("room_seat_action", luckyEvent);
        playLuckyGiftFly(luckyEvent);
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
