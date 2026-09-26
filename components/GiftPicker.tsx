"use client";

import React, { useEffect, useRef, useState } from "react";
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

type Fly = {
  id: string;
  image: string;
  left: number;
  top: number;
  dx: number;
  dy: number;
  phase: "start" | "end";
};

export default function GiftPicker(props: any) {
  const [flies, setFlies] = useState<Fly[]>([]);
  const animatingRef = useRef(false);
  const closeRef = useRef<(() => void) | null>(null);
  const safetyCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLuckyFly = (data: any) => {
    const image = String(data.image || LUCKY_GIFT_IMAGES[String(data.giftName || "")] || "");
    if (!image) return false;

    const recipientIds = new Set(
      Array.isArray(data.recipientIds) ? data.recipientIds.map(String) : []
    );

    const targets = (Array.isArray(props.seats) ? props.seats : []).filter(
      (seat: any) =>
        seat?.isOccupied &&
        seat?.user?.accountId &&
        recipientIds.has(String(seat.user.accountId))
    );

    if (!targets.length) return false;

    const created: Fly[] = [];

    targets.forEach((seat: any, index: number) => {
      const name = String(seat.user.name || "");
      let target: HTMLImageElement | null = null;

      if (name) {
        const escapedName =
          typeof CSS !== "undefined" && CSS.escape
            ? CSS.escape(name)
            : name.replace(/["\\]/g, "\\$&");
        target = document.querySelector(
          `img[alt="${escapedName}"]`
        ) as HTMLImageElement | null;
      }

      if (!target && seat.user.image) {
        const wanted = new URL(
          String(seat.user.image),
          window.location.href
        ).href;
        target =
          Array.from(document.images).find((img) => {
            try {
              return (
                new URL(
                  img.currentSrc || img.src,
                  window.location.href
                ).href === wanted
              );
            } catch {
              return false;
            }
          }) || null;
      }

      if (!target) return;

      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const startX = window.innerWidth / 2;
      const startY = window.innerHeight + 55;
      const endX = rect.left + rect.width / 2;
      const endY = rect.top + rect.height / 2;

      created.push({
        id: `${String(seat.user.accountId)}-${Date.now()}-${index}`,
        image,
        left: startX,
        top: startY,
        dx: endX - startX,
        dy: endY - startY,
        phase: "start",
      });
    });

    if (!created.length) return false;

    animatingRef.current = true;
    setFlies(created);

    // First paint puts the real PNG below the screen; second paint
    // transitions it upward to the actual occupied avatar.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlies((current) =>
          current.map((fly) => ({ ...fly, phase: "end" }))
        );
      });
    });

    if (safetyCloseRef.current) clearTimeout(safetyCloseRef.current);
    safetyCloseRef.current = window.setTimeout(() => {
      setFlies([]);
      animatingRef.current = false;
      closeRef.current?.();
      closeRef.current = null;
      safetyCloseRef.current = null;
    }, 1150);

    return true;
  };

  useEffect(() => {
    const handleLuckySeatAction = (data: any = {}) => {
      if (String(data.roomId || "") !== String(props.roomId || "")) return;
      if (data.action !== "lucky_image" || !data.src) return;

      startLuckyFly({
        image: String(data.src),
        recipientIds: [String(data.user?.accountId || "")],
        giftName: "Lucky",
      });
    };

    socket.on("room_seat_action", handleLuckySeatAction);
    return () => {
      socket.off("room_seat_action", handleLuckySeatAction);
    };
  }, [props.roomId, props.seats]);

  useEffect(() => {
    const originalEmit = socket.emit.bind(socket);

    const patchedEmit = ((event: string, ...args: any[]) => {
      if (event !== "coin_transfer" || !args[0]) {
        return originalEmit(event, ...args);
      }

      const data = { ...args[0] };
      const image = String(data.image || LUCKY_GIFT_IMAGES[String(data.giftName || "")] || "");

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

      animatingRef.current = true;
      if (safetyCloseRef.current) clearTimeout(safetyCloseRef.current);
      safetyCloseRef.current = window.setTimeout(() => {
        setFlies([]);
        animatingRef.current = false;
        props.onClose?.();
        closeRef.current = null;
        safetyCloseRef.current = null;
      }, 1600);
      return socket;
    }) as typeof socket.emit;

    (socket as any).emit = patchedEmit;
    return () => {
      (socket as any).emit = originalEmit;
    };
  }, [props.seats]);

  const handleClose = () => {
    if (animatingRef.current) {
      closeRef.current = props.onClose;
      return;
    }
    props.onClose?.();
  };

  return (
    <>
      {!animatingRef.current && (
        <GiftPickerBase {...props} onClose={handleClose} />
      )}

      {flies.map((fly) => (
        <img
          key={fly.id}
          src={fly.image}
          alt="Lucky Gift"
          aria-hidden="true"
          draggable={false}
          className="fixed pointer-events-none z-[10000] select-none"
          style={{
            left: fly.left,
            top: fly.top,
            width: fly.phase === "start" ? "82px" : "18px",
            height: fly.phase === "start" ? "82px" : "18px",
            objectFit: "contain",
            transform:
              fly.phase === "start"
                ? "translate(-50%, -50%) translate(0px, 0px) scale(1)"
                : `translate(-50%, -50%) translate(${fly.dx}px, ${fly.dy}px) scale(1)`,
            opacity: fly.phase === "start" ? 1 : 0,
            transition:
              "transform 1100ms cubic-bezier(0.18,0.72,0.32,1), width 1100ms ease-out, height 1100ms ease-out, opacity 1100ms ease-out",
          }}
        />
      ))}
    </>
  );
}
