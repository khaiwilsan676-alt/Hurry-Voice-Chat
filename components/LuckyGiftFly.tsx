import React, { useEffect, useRef, useState } from "react";
import socket from "../src/lib/socket";

const LUCKY_GIFT_IMAGES: Record<string, string> = {
  Kiss: "/IMG_20260906_000443.png", Nut: "/IMG_20260906_000508.png", Mahjong: "/IMG_20260906_000521.png", Clover: "/IMG_20260906_000541.png", Charm: "/IMG_20260906_000624.png", Bouquet: "/IMG_20260906_000643.png", Leaves: "/IMG_20260906_000713.png", Crystal: "/IMG_20260906_000756.png", Candy: "/IMG_20260906_000814.png", Pop: "/IMG_20260906_000832.png", Scarecrow: "/IMG_20260906_000850.png"
};

export function isLuckyGift(giftName: unknown) { return !!LUCKY_GIFT_IMAGES[String(giftName || "")]; }
export function luckyDiamondValue(coins: unknown) { const n=Number(coins); return Number.isFinite(n)&&n>0 ? Math.floor(n*0.1) : 0; }

export default function GiftPicker({ children, onLuckyGift }: { children: React.ReactNode; onLuckyGift?: (payload:any)=>void }) {
  const onLuckyGiftRef=useRef(onLuckyGift); onLuckyGiftRef.current=onLuckyGift;
  useEffect(()=>{
    const originalEmit=socket.emit.bind(socket);
    const patchedEmit=((event:string,...args:any[])=>{
      if(event!=="coin_transfer" || !args[0]) return originalEmit(event,...args);
      const data={...args[0]}; const image=LUCKY_GIFT_IMAGES[String(data.giftName||"")];
      if(!image) return originalEmit(event,...args);
      const amount=Number(data.amount); const diamondAmount=luckyDiamondValue(amount);
      // Keep the original coin value on the transfer. The server/receiver can award only 10% Diamonds.
      originalEmit("coin_transfer",{...data, luckyGift:true, luckyImage:image, diamondAmount});
      onLuckyGiftRef.current?.({roomId:String(data.roomId||""),senderId:String(data.senderId||""),recipientIds:Array.isArray(data.recipientIds)?data.recipientIds.map(String):[],image,diamondAmount,timestamp:Date.now()});
      return socket;
    }) as typeof socket.emit;
    (socket as any).emit=patchedEmit; return()=>{(socket as any).emit=originalEmit};
  },[]);
  return <>{children}</>;
}
