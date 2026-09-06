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
      { fill: "#FF4500", glow: "rgba(255, 69, 0, 0.6)" },    // Fiery Orange-Red
      { fill: "#FF6B1A", glow: "rgba(255, 107, 26, 0.6)" },  // SHINE Ember
      { fill: "#FFB000", glow: "rgba(255, 176, 0, 0.5)" },   // Warm Gold Spark
      { fill: "#FFD700", glow: "rgba(255, 215, 0, 0.4)" },   // Golden Flare
      { fill: "#FFF3B0", glow: "rgba(255, 243, 176, 0.5)" },  // Hot Core Spark
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

      // Draw ultra-faint golden circuit geometry grid
      ctx.strokeStyle = "rgba(217, 164, 65, 0.035)";
      ctx.lineWidth = 1;
      const gridSize = 90;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render realistic rising flame embers
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

        // Draw glowing ember spark
        ctx.save();
        ctx.shadowBlur = currentSize * 5;
        ctx.shadowColor = e.glowColor;
        ctx.fillStyle = e.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, e.opacity));

        ctx.beginPath();
        ctx.arc(e.x, e.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
