import React, { useEffect, useRef, useState } from "react";
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
  Scarecrow: "/IMG_20260906_000850.png"
};

export function isLuckyGift(giftName: unknown) { return !!LUCKY_GIFT_IMAGES[String(giftName || "")]; }
export function luckyDiamondValue(coins: unknown) { const n=Number(coins); return Number.isFinite(n)&&n>0 ? Math.floor(n*0.1) : 0; }

export default function GiftPicker({ children, onLuckyGift }: { children: React.ReactNode; onLuckyGift?: (payload:any)=>void }) {
  const onLuckyGiftRef = useRef(onLuckyGift); 
  onLuckyGiftRef.current = onLuckyGift;
  
  // Animation ke liye state (Keval flying images ko handle karega)
  const [flyingGifts, setFlyingGifts] = useState<{id: number, image: string}[]>([]);
  const giftIdCounter = useRef(0);

  useEffect(() => {
    const originalEmit = socket.emit.bind(socket);
    const patchedEmit = ((event: string, ...args: any[]) => {
      if(event !== "coin_transfer" || !args[0]) return originalEmit(event, ...args);
      const data = {...args[0]}; 
      const image = LUCKY_GIFT_IMAGES[String(data.giftName || "")];
      if(!image) return originalEmit(event, ...args);
      
      const amount = Number(data.amount); 
      const diamondAmount = luckyDiamondValue(amount);
      
      // Keep the original coin value on the transfer. The server/receiver can award only 10% Diamonds.
      originalEmit("coin_transfer", {...data, luckyGift: true, luckyImage: image, diamondAmount});
      
      onLuckyGiftRef.current?.({
        roomId: String(data.roomId || ""),
        senderId: String(data.senderId || ""),
        recipientIds: Array.isArray(data.recipientIds) ? data.recipientIds.map(String) : [],
        image,
        diamondAmount,
        timestamp: Date.now()
      });

      // --- NAYA LOGIC: Image ko screen par fly karwane ke liye ---
      const currentId = giftIdCounter.current++;
      setFlyingGifts(prev => [...prev, { id: currentId, image }]);

      // 2.5 seconds ke baad image ko DOM se hata do (kyunki animation 2.5s ka hai)
      setTimeout(() => {
        setFlyingGifts(prev => prev.filter(gift => gift.id !== currentId));
      }, 2500);

      return socket;
    }) as typeof socket.emit;
    
    (socket as any).emit = patchedEmit; 
    return () => { (socket as any).emit = originalEmit; };
  }, []);

  return (
    <>
      {/* Aapka baaki room ka UI waise ka waisa hi rahega (Untouched) */}
      {children}

      {/* Flying Images Rendering Layer */}
      {flyingGifts.map((gift) => (
        <img 
          key={gift.id}
          src={gift.image}
          className="lucky-flying-image-custom"
          alt="Lucky Gift"
        />
      ))}

      {/* Animation CSS - Isko alag se CSS file me dalne ki zaroorat nahi hai, yehi handle kar lega */}
      <style>{`
        .lucky-flying-image-custom {
          position: fixed;
          z-index: 99999;
          pointer-events: none;
          opacity: 1 !important; /* Kabhi fade nahi hoga */
          animation: flyCenterHoldTarget 2.5s ease-in-out forwards;
        }

        @keyframes flyCenterHoldTarget {
          /* 0% -> Niche se aayega */
          0% {
            top: 100vh;
            left: 50vw;
            transform: translate(-50%, -50%) scale(0.5);
          }
          
          /* 20% (0.5s me) -> Screen ke center me aayega, Original Size pe */
          20% {
            top: 50vh;
            left: 50vw;
            transform: translate(-50%, -50%) scale(1);
          }
          
          /* 60% (Agla 1 second) -> Center me hold karega same size pe */
          60% {
            top: 50vh;
            left: 50vw;
            transform: translate(-50%, -50%) scale(1);
          }
          
          /* 100% -> Apne target position par chala jayega (Right-Top header ki taraf) bina fade hue */
          100% {
            top: 10vh;  /* Target vertical position */
            left: 90vw; /* Target horizontal position */
            transform: translate(-50%, -50%) scale(0.4); /* Target par thoda chota ho jayega */
          }
        }
      `}</style>
    </>
  );
}
