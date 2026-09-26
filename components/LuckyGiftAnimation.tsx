"use client";

import { useEffect, useRef } from "react";
import socket from "../src/lib/socket";

type LuckyGiftAnimationProps = {
  roomId: string;
};

function findTargetAvatar(data: any): HTMLImageElement | null {
  const seatNumber = Number(data?.seatNumber || 0);
  const accountId = String(data?.user?.accountId || "");
  const name = String(data?.targetName || data?.user?.name || "");

  if (Number.isFinite(seatNumber) && seatNumber > 0) {
    const el = document.querySelector(
      `img[data-hurry-seat="${seatNumber}"]`
    ) as HTMLImageElement | null;
    if (el) return el;
  }

  if (accountId) {
    const els = document.querySelectorAll("img[data-hurry-account]");
    for (const el of Array.from(els)) {
      if (String(el.getAttribute("data-hurry-account") || "") === accountId) {
        return el as HTMLImageElement;
      }
    }
  }

  if (name) {
    const els = document.querySelectorAll("img[data-hurry-account]");
    for (const el of Array.from(els)) {
      if (String(el.getAttribute("alt") || "") === name) {
        return el as HTMLImageElement;
      }
    }
  }

  return null;
}

function animateLuckyGift(data: any, roomId: string) {
  if (typeof document === "undefined") return;
  if (String(data?.roomId || "") !== String(roomId)) return;
  if (data?.action !== "lucky_image") return;

  const src = String(data?.src || "");
  if (!src) return;

  let attempts = 0;
  let cancelled = false;

  const findAndRun = () => {
    if (cancelled) return;

    const target = findTargetAvatar(data);
    if (!target) {
      if (attempts++ < 20) window.setTimeout(findAndRun, 75);
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const flyer = document.createElement("img");
    flyer.src = src;
    flyer.alt = "";
    flyer.setAttribute("aria-hidden", "true");
    flyer.draggable = false;

    const size = Math.max(48, Math.min(82, Math.round(rect.width * 1.35)));
    const half = size / 2;
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight - Math.max(18, size / 2);
    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;
    const duration =
      Number(data?.duration) > 0
        ? Math.min(1800, Math.max(600, Number(data.duration)))
        : 1100;

    Object.assign(flyer.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${size}px`,
      height: `${size}px`,
      objectFit: "contain",
      pointerEvents: "none",
      userSelect: "none",
      zIndex: "2147483647",
      opacity: "1",
      transform: `translate3d(${startX - half}px,${startY - half}px,0) scale(1)`,
      transition: `transform ${duration}ms cubic-bezier(.18,.72,.32,1), opacity ${duration}ms ease-out`,
      willChange: "transform,opacity",
    });

    const start = () => {
      if (cancelled) {
        flyer.remove();
        return;
      }

      document.documentElement.appendChild(flyer);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flyer.style.transform =
            `translate3d(${endX - half}px,${endY - half}px,0) scale(.22)`;
          flyer.style.opacity = "0";
        });
      });

      window.setTimeout(() => flyer.remove(), duration + 180);
    };

    flyer.onload = start;
    flyer.onerror = () => flyer.remove();

    if (flyer.complete && flyer.naturalWidth > 0) start();
  };

  requestAnimationFrame(findAndRun);

  return () => {
    cancelled = true;
  };
}

export default function LuckyGiftAnimation({ roomId }: LuckyGiftAnimationProps) {
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    const handler = (data: any) => {
      animateLuckyGift(data, roomIdRef.current);
    };

    socket.on("room_seat_action", handler);

    return () => {
      socket.off("room_seat_action", handler);
    };
  }, []);

  return null;
}
