"use client";

import { useEffect, useRef } from "react";

interface FlameEmber {
  x: number;
  y: number;
  size: number;
  maxSize: number;
  speedY: number;
  speedX: number;
  swaySpeed: number;
  swayOffset: number;
  opacity: number;
  maxOpacity: number;
  color: string;
  glowColor: string;
  life: number;
  maxLife: number;
}

interface ParticleFieldProps {
  particleCount?: number;
}

export default function ParticleField({ particleCount = 70 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const emberColors = [
      { fill: "#006BFF", glow: "rgba(0, 107, 255, 0.4)" },    // Signal Blue
      { fill: "#0099FF", glow: "rgba(0, 153, 255, 0.4)" },    // Blob Cyan
      { fill: "#476788", glow: "rgba(71, 103, 136, 0.35)" },  // Slate
      { fill: "#B4C7DB", glow: "rgba(180, 199, 219, 0.4)" },  // Hairline Strong
      { fill: "#0B3558", glow: "rgba(11, 53, 88, 0.35)" },    // Ink Navy
    ];

    const createEmber = (initialY?: number): FlameEmber => {
      const colorScheme = emberColors[Math.floor(Math.random() * emberColors.length)];
      const maxLife = Math.random() * 260 + 140;
      return {
        x: Math.random() * width,
        y: initialY !== undefined ? initialY : height + Math.random() * 40,
        size: Math.random() * 2.5 + 1.2,
        maxSize: Math.random() * 3.5 + 1.5,
        speedY: Math.random() * 0.9 + 0.4,
        speedX: (Math.random() - 0.5) * 0.3,
        swaySpeed: Math.random() * 0.03 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: 0,
        maxOpacity: Math.random() * 0.6 + 0.25,
        color: colorScheme.fill,
        glowColor: colorScheme.glow,
        life: 0,
        maxLife: maxLife,
      };
    };

    const embers: FlameEmber[] = [];
    for (let i = 0; i < particleCount; i++) {
      embers.push(createEmber(Math.random() * height));
    }

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Draw ultra-faint navy circuit geometry grid once per frame efficiently
      ctx.strokeStyle = "rgba(11, 53, 88, 0.035)";
      ctx.lineWidth = 1;
      const gridSize = 100;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Render rising flame embers with lightweight drawing
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life++;

        // Upward floating motion with natural thermal drift & sway
        e.y -= e.speedY;
        e.x += e.speedX + Math.sin(time * 2 + e.swayOffset) * 0.35;

        // Life cycle fade in and fade out
        const lifeRatio = e.life / e.maxLife;
        if (lifeRatio < 0.2) {
          e.opacity = (lifeRatio / 0.2) * e.maxOpacity;
        } else if (lifeRatio > 0.7) {
          e.opacity = (1 - (lifeRatio - 0.7) / 0.3) * e.maxOpacity;
        } else {
          // Subtle flickering
          e.opacity = e.maxOpacity * (0.85 + Math.sin(time * 12 + e.swayOffset) * 0.15);
        }

        // Slight size shrinkage as ember ascends
        const currentSize = Math.max(0.6, e.maxSize * (1 - lifeRatio * 0.4));

        // Respawn if off top or life expired
        if (e.y < -20 || e.life >= e.maxLife) {
          embers[i] = createEmber();
          continue;
        }

        // Draw glowing ember spark with fast fill
        ctx.fillStyle = e.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, e.opacity));

        ctx.beginPath();
        ctx.arc(e.x, e.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-90"
    />
  );
}
