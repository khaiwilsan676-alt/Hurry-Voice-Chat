"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, Clock } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  image: string; 
  tryVideo?: string; 
  removeGreen?: boolean; 
  tab: string;
  stars: number;
  price: string;
  duration: string;
  isOwned?: boolean;
}

// Naya Tab data icons ke sath
const tabData = [
  { id: "Vehicle", label: "Vehicle", icon: "/IMG_20260913_090019.png" },
  { id: "Avatar Frame", label: "Frame", icon: "/IMG_20260913_090057.png" },
  { id: "Theme", label: "Theme", icon: "/IMG_20260913_090137.png" },
  { id: "Chat Bubble", label: "Bubble", icon: "/IMG_20260913_090116.png" },
  { id: "ID", label: "ID", icon: "/IMG_20260913_090150.png" },
];

const allStoreItems: StoreItem[] = [
  // Vehicle
  { 
    id: "v1", 
    name: "Leopard Roar", 
    image: "/IMG_20260905_222412.jpg", 
    tryVideo: "/VID_20260905_095157_269_bsl.mp4", 
    removeGreen: true, 
    tab: "Vehicle", 
    stars: 5, 
    price: "1,000,000", 
    duration: "5D" 
  },

  // Avatar Frame
  { id: "a1", name: "Crown Wings", image: "/VID_20260905_024534_955_bsl.mp4", tab: "Avatar Frame", stars: 5, price: "250,000", duration: "3D" },
  { id: "a2", name: "Host Wings", image: "/VID_20260905_024726_660_bsl.mp4", tab: "Avatar Frame", stars: 5, price: "500,000", duration: "3D" },
  { id: "a3", name: "Mystic Wings", image: "/VID_20260905_083446_619_bsl.mp4", tab: "Avatar Frame", stars: 5, price: "750,000", duration: "3D" }, 

  // Theme
  { id: "t1", name: "Seafood", image: "/IMG-20260904-WA0004.jpg", tab: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t2", name: "Night Sky", image: "/IMG-20260904-WA0005.jpg ", tab: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
  { id: "t3", name: "Seafood", image: "/IMG-20260904-WA0006.jpg", tab: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t4", name: "Night Sky", image: "/IMG-20260904-WA0007.jpg ", tab: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
  { id: "t5", name: "Seafood", image: "/IMG-20260904-WA0040.jpg", tab: "Theme", stars: 4, price: "2,700,000", duration: "30D" },
  { id: "t6", name: "Night Sky", image: "/IMG-20260904-WA0041.jpg ", tab: "Theme", stars: 5, price: "2,400,000", duration: "30D" },
  
  // Chat Bubble
  { id: "c1", name: "1", image: "/file_000000003d888211822aa6837fe5013c.png", tab: "Chat Bubble", stars: 4, price: "500,000", duration: "3D" },
  { id: "c2", name: "2", image: "/file_000000006044821186ff566329797142.png", tab: "Chat Bubble", stars: 4, price: "250,000", duration: "2D" }, 
  { id: "c3", name: "3", image: "/file_00000000c44c81f598f62ae8a45e13a7.png", tab: "Chat Bubble", stars: 5, price: "300,000", duration: "3D" }, 
  
  // ID
  { id: "i1", name: "ID Badge 8", image: "/1784533036732~2.jpg", tab: "ID", stars: 5, price: "10,000,000", duration: "3D", isOwned: true },
];

function WebGLCoinIcon({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, alpha: true });
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        if (lum > 0.85 && color.r > 0.8 && color.g > 0.8 && color.b > 0.8) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        } else {
          gl_FragColor = color;
        }
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,  1, 1,  0, 0,
      0, 0,  1, 1,  1, 0,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
  }, [src]);

  return <canvas ref={canvasRef} width={64} height={64} className="w-full h-full object-contain" />;
}

function WebGLImageAvatar({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, alpha: true });
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      
      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        float maxRB = max(color.r, color.b);
        float greenness = color.g - maxRB;
        
        float alpha = 1.0 - smoothstep(0.04, 0.12, greenness);
        
        color.g = min(color.g, maxRB + 0.05);
        
        if (alpha < 0.01) {
          discard;
        }
        
        gl_FragColor = vec4(color.rgb * alpha, alpha);
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
  }, [src]);

  return <canvas ref={canvasRef} width={256} height={256} className="w-full h-full object-contain" />;
}

function WebGLVideoAvatar({ src, isVehicleModal = false }: { src: string; isVehicleModal?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: false, alpha: true });
    if (!gl) return;

    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = !isVehicleModal;
    video.playsInline = true;
    video.play().catch(e => console.log("Video auto-play prevented:", e));

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      
      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        float maxRB = max(color.r, color.b);
        float greenness = color.g - maxRB;
        
        float alpha = 1.0 - smoothstep(0.04, 0.12, greenness);
        
        color.g = min(color.g, maxRB + 0.05);
        
        if (alpha < 0.01) {
          discard;
        }
        
        gl_FragColor = vec4(color.rgb * alpha, alpha);
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    let animationFrameId: number;

    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.pause();
      video.removeAttribute("src");
      video.load();
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(texCoordBuffer);
      gl.deleteProgram(program);
    };
  }, [src, isVehicleModal]);

  return <canvas ref={canvasRef} width={512} height={512} className="w-full h-full object-contain" />;
}

export default function StorePage({ onBack, initialView = "store" }: { onBack: () => void; initialView?: "store" | "bag" }) {
  const [currentView, setCurrentView] = useState<"store" | "bag">(initialView);
  const [activeTab, setActiveTab] = useState("Vehicle");
  const [tryThemeItem, setTryThemeItem] = useState<StoreItem | null>(null);
  const [tryCenterItem, setTryCenterItem] = useState<StoreItem | null>(null);

  const displayedItems = allStoreItems.filter(item => {
    if (currentView === "bag") {
      return item.isOwned && item.tab === activeTab;
    }
    return item.tab === activeTab;
  });

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-[16px] leading-none ${i < count ? 'text-yellow-400' : 'text-gray-200'}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="h-screen bg-[#f5f6f8] text-gray-800 select-none font-sans relative flex flex-col overflow-hidden">
      <div className="max-w-md mx-auto w-full h-full flex flex-col relative">
        
        {/* Fixed/Sticky Top Area (Header + Tabs) */}
        <div className="sticky top-0 left-0 w-full z-40 bg-[#f5f6f8] flex flex-col">
          
          {/* Top Header (Absolute Top) */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 w-full">
            <button
              type="button"
              onClick={() => {
                if (currentView === "bag") {
                  setCurrentView("store");
                } else {
                  onBack();
                }
              }}
              className="p-1 -ml-2 text-black hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <ArrowLeft size={26} strokeWidth={2} />
            </button>
            
            <h1 className="text-[18px] font-bold text-black absolute left-1/2 -translate-x-1/2 z-0">
              {currentView === "store" ? "Store" : "Bag"}
            </h1>

            {/* Changed from Images to Simple Text */}
            <button 
              type="button"
              onClick={() => setCurrentView(currentView === "store" ? "bag" : "store")}
              className="font-bold text-[#1d4ed8] text-[15px] z-10 hover:opacity-80 transition-opacity pr-1"
            >
              {currentView === "store" ? "Bag" : "Store"}
            </button>
          </div>

          {/* Category Tabs (1.5 gap from header = mt-6, gap-1 between tabs) */}
          <div className="flex items-center gap-1 px-4 mt-3 mb-3 overflow-x-auto no-scrollbar shrink-0 w-full">
            {tabData.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-[72px] h-[80px] rounded-md flex flex-col items-center justify-center shrink-0 overflow-hidden transition-all ${
                    isActive ? "bg-transparent" : "bg-black/20"
                  }`}
                >
                  {/* Background card image if active */}
                  {isActive && (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src="/IMG_20260913_090226.png"
                        alt="Active Bg"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Icon & Title */}
                  <div className="relative z-10 flex flex-col items-center gap-1 mt-1">
                    <div className="relative w-8 h-8">
                      <Image
                        src={tab.icon}
                        alt={tab.label}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-white tracking-wide">
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Bottom Area (Grid & ID View) */}
        <div className="flex-1 overflow-y-auto no-scrollbar w-full pb-10">
          {activeTab === "ID" ? (
            <div className="px-4 py-2 flex flex-col gap-3 h-full">
              {/* Customize ID Card Box */}
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <h2 className="text-[17px] font-bold text-gray-900">Customize ID</h2>
                <div className="w-full bg-[#f3f4f6] text-gray-400 text-[14px] font-medium py-3 px-4 rounded-2xl text-center">
                  Start Your Customization Journey
                </div>
              </div>

              {/* Bottom Customize Button */}
              <button 
                type="button"
                className="w-full bg-[#f3f4f6] text-gray-400 font-semibold py-3.5 rounded-2xl text-[15px] shadow-sm text-center"
              >
                Customize
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 px-4 py-1 content-start">
              {displayedItems.map((item) => {
                const isTheme = item.tab === "Theme";
                const isVehicle = item.tab === "Vehicle";
                const isAvatarFrame = item.tab === "Avatar Frame";

                return (
                  <div
                    key={item.id}
                    className={`relative bg-white rounded-xl p-1 flex flex-col items-center justify-between shadow-sm overflow-hidden ${
                      isTheme ? "min-h-[220px]" : "h-auto"
                    }`}
                  >
                    {isTheme && (
                      <div className="absolute inset-0 w-full h-full z-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                      </div>
                    )}

                    {/* Top Bar inside Card */}
                    <div className="flex items-center justify-between w-full z-10 mb-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isTheme) {
                            setTryThemeItem(item);
                          } else {
                            setTryCenterItem(item);
                          }
                        }}
                        className={`px-3 py-[2px] rounded-full text-[11px] font-medium border ${
                          isTheme 
                            ? "text-white border-white bg-white/20" 
                            : "text-[#1d4ed8] border-[#1d4ed8]"
                        }`}
                      >
                        Try
                      </button>
                      <div className={`flex items-center gap-1 text-[11px] font-medium ${isTheme ? "text-white drop-shadow-md" : "text-gray-500"}`}>
                        <Clock size={12} strokeWidth={2.5} />
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    {!isTheme && (
                      <div className="relative w-full h-[80px] my-2 flex items-center justify-center z-10">
                        <div className={`absolute flex items-center justify-center ${
                          isVehicle || isAvatarFrame ? "w-[120px] h-[120px]" : "w-full h-full"
                        }`}>
                          {item.image.endsWith('.mp4') ? (
                            <WebGLVideoAvatar src={item.image} />
                          ) : item.removeGreen ? (
                            <WebGLImageAvatar src={item.image} />
                          ) : (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-contain"
                              sizes="50vw"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {isTheme && <div className="flex-1 w-full min-h-[80px]"></div>}

                    {/* Stars */}
                    <div className="flex items-center justify-center gap-0.5 mt-2 mb-1 w-full z-10">
                      {renderStars(item.stars)}
                    </div>

                    {/* Price Row */}
                    <div className="flex items-center justify-center gap-1.5 mb-3 w-full z-10">
                      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                        <WebGLCoinIcon src="/1786855398290.png" />
                      </div>
                      <span className={`text-[14px] font-bold tracking-tight truncate ${isTheme ? "text-white drop-shadow-md" : "text-gray-900"}`}>
                        {item.price}
                      </span>
                    </div>

                    {/* Bottom Buttons */}
                    <div className="flex items-center w-full rounded-full border border-[#1d4ed8] overflow-hidden h-[30px] z-10 bg-white">
                      <button
                        type="button"
                        className="flex-1 h-full bg-white text-[#1d4ed8] text-[12px] font-bold flex items-center justify-center transition-colors hover:bg-gray-50"
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        className="flex-1 h-full bg-[#1d4ed8] text-white text-[12px] font-bold flex items-center justify-center transition-colors hover:bg-blue-800"
                      >
                        {currentView === "bag" ? "Equip" : "Buy"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {displayedItems.length === 0 && (
                <div className="col-span-2 text-center text-gray-400 mt-12 text-sm font-medium">
                  {currentView === "bag" ? "No items in Bag for this category" : "No items found"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULL WIDE VEHICLE & FRAME TRY MODAL */}
      {tryCenterItem && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/10 p-0 cursor-pointer"
          onClick={() => setTryCenterItem(null)}
        >
          <div className={`relative flex items-center justify-center pointer-events-none ${tryCenterItem.tab === "Vehicle" ? "w-full h-[60vh]" : "w-[280px] h-[280px]"}`}>
            {tryCenterItem.tryVideo ? (
              <WebGLVideoAvatar src={tryCenterItem.tryVideo} isVehicleModal={tryCenterItem.tab === "Vehicle"} />
            ) : tryCenterItem.image.endsWith('.mp4') ? (
              <WebGLVideoAvatar src={tryCenterItem.image} isVehicleModal={tryCenterItem.tab === "Vehicle"} />
            ) : tryCenterItem.removeGreen ? (
               <WebGLImageAvatar src={tryCenterItem.image} />
            ) : (
              <Image src={tryCenterItem.image} alt={tryCenterItem.name} fill className="object-contain" />
            )}
          </div>

          <div className="flex items-center justify-center gap-1 mt-4 pointer-events-none">
            {renderStars(tryCenterItem.stars)}
          </div>

          <div className="mt-2 text-[20px] font-bold text-gray-900 pointer-events-none">
            {tryCenterItem.name}
          </div>
        </div>
      )}

      {/* THEME TRY OVERLAY MODAL */}
      {tryThemeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-[260px] flex flex-col items-center">
            
            <button
              type="button"
              onClick={() => setTryThemeItem(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg font-bold hover:bg-white/40 z-20"
            >
              ✕
            </button>

            <div className="relative w-[230px] h-[480px] rounded-3xl border-[4px] border-yellow-300 overflow-hidden shadow-2xl bg-black">
              <Image
                src={tryThemeItem.image}
                alt={tryThemeItem.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex items-center justify-center gap-1 mt-4">
              {renderStars(tryThemeItem.stars)}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

