"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface EntryEffectProps {
  vehicleUrl: string;
  userName: string;
  onComplete?: () => void;
}

export default function EntryEffect({ vehicleUrl, userName, onComplete }: EntryEffectProps) {
  const [isVisible, setIsVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Hide effect after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // If the vehicle URL is an MP4, render WebGL video avatar (like in StorePage)
  // Else, render an image.
  useEffect(() => {
    if (!vehicleUrl.endsWith('.mp4')) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: true });
    if (!gl) return;

    const video = document.createElement("video");
    video.src = vehicleUrl;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.play().catch(console.error);

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
        // Simple green screen removal based on RGB values
        vec4 color = texture2D(u_image, v_texCoord);
        if (color.g > 0.5 && color.r < 0.3 && color.b < 0.3) {
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
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const texCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let animationFrameId: number;

    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

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
    };

  }, [vehicleUrl]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full max-w-[300px] flex flex-col items-center justify-center animate-bounce-in">
      {vehicleUrl.endsWith('.mp4') ? (
         <canvas ref={canvasRef} width={512} height={512} className="w-[120px] h-[120px] object-contain drop-shadow-2xl" />
      ) : (
         <img src={vehicleUrl} alt="Vehicle Entry" className="w-[120px] h-[120px] object-contain drop-shadow-2xl" />
      )}
      <div className="mt-2 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 px-4 py-1.5 rounded-full shadow-lg border border-yellow-200">
        <span className="text-black font-bold text-sm tracking-wide">
          {userName} entered the room!
        </span>
      </div>
    </div>
  );
}
