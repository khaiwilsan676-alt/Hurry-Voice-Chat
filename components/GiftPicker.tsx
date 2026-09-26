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

function findTargetAvatar(
  seatNumber: number,
  accountId: string,
  name: string
): HTMLImageElement | null {
  if (Number.isFinite(seatNumber) && seatNumber > 0) {
    const bySeat = document.querySelector(
      `img[data-hurry-seat="${seatNumber}"]`
    ) as HTMLImageElement | null;
    if (bySeat) return bySeat;
  }

  if (accountId) {
    const escapedAccount =
      typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(accountId)
        : accountId.replace(/["\\]/g, "\\$&");
    const byAccount = document.querySelector(
      `img[data-hurry-account="${escapedAccount}"]`
    ) as HTMLImageElement | null;
    if (byAccount) return byAccount;
  }

  if (name) {
    const escapedName =
      typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(name)
        : name.replace(/["\\]/g, "\\$&");
    const byName = document.querySelector(
      `img[alt="${escapedName}"]`
    ) as HTMLImageElement | null;
    if (byName) return byName;
  }

  return null;
}

function playLuckyGiftFly(data: any) {
  if (typeof window === "undefined" || data?.action !== "lucky_image") return;

  const image = String(data.src || "");
  if (!image) return;

  const targetAccountId = String(data.user?.accountId || "");
  const targetSeatNumber = Number(data.seatNumber || 0);
  const targetName = String(data.targetName || data.user?.name || "");

  let attempts = 0;
  const findAndAnimate = () => {
    const target = findTargetAvatar(
      targetSeatNumber,
      targetAccountId,
      targetName
    );

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

    const startAnimation = () =>
      flyer.animate(
        [
          {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: 1,
          },
          {
            transform: `translate(calc(-50% + ${endX - startX}px), calc(-50% + ${endY - startY}px)) scale(0.22)`,
            opacity: 0,
          },
        ],
        {
          duration: Number(data.duration) > 0 ? Number(data.duration) : 1100,
          easing: "cubic-bezier(0.18,0.72,0.32,1)",
          fill: "forwards",
        }
      );

    const run = () => {
      const animation = startAnimation();
      animation.onfinish = () => flyer.remove();
    };

    if (flyer.complete && flyer.naturalWidth > 0) {
      run();
    } else {
      flyer.onload = run;
      flyer.onerror = () => flyer.remove();
    }
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
