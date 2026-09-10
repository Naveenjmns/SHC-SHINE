"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Person {
  x: number; // 0 to 1 normalized floor plane x
  y: number; // 0 to 1 normalized floor plane depth
  speed: number;
  angle: number;
  walkCycle: number;
  walkSpeed: number;
  outfit: {
    skinTone: string;
    shirtColor: string;
    pantsColor: string;
    shoesColor: string;
    hairColor: string;
    style: "tshirt" | "jacket" | "hoodie" | "sweater" | "loose-pants";
  };
  targetX: number;
  targetY: number;
  size: number;
}

interface ErrorPerspectiveStageProps {
  children?: React.ReactNode;
  interactive?: boolean;
  className?: string;
}

const DEFAULT_PEOPLE_CONFIGS: Person["outfit"][] = [
  {
    skinTone: "#E0AC69",
    shirtColor: "#8B263E",
    pantsColor: "#232D3F",
    shoesColor: "#1E1E1E",
    hairColor: "#A08060",
    style: "sweater",
  },
  {
    skinTone: "#F1C27D",
    shirtColor: "#E2E8F0",
    pantsColor: "#1E293B",
    shoesColor: "#F8FAFC",
    hairColor: "#2C1B18",
    style: "tshirt",
  },
  {
    skinTone: "#C68642",
    shirtColor: "#27272A",
    pantsColor: "#3F4E3A",
    shoesColor: "#222222",
    hairColor: "#1A1A1A",
    style: "jacket",
  },
  {
    skinTone: "#E8BEAC",
    shirtColor: "#71717A",
    pantsColor: "#1E293B",
    shoesColor: "#FFFFFF",
    hairColor: "#3D2314",
    style: "tshirt",
  },
  {
    skinTone: "#D4AA78",
    shirtColor: "#18181B",
    pantsColor: "#09090B",
    shoesColor: "#27272A",
    hairColor: "#18181B",
    style: "jacket",
  },
  {
    skinTone: "#8D5524",
    shirtColor: "#FF6B1A",
    pantsColor: "#3F3F46",
    shoesColor: "#18181B",
    hairColor: "#09090B",
    style: "loose-pants",
  },
  {
    skinTone: "#FFDBAC",
    shirtColor: "#0F172A",
    pantsColor: "#D9A441",
    shoesColor: "#F8FAFC",
    hairColor: "#4A3728",
    style: "hoodie",
  },
];

export default function ErrorPerspectiveStage({
  children,
  interactive = true,
  className = "",
}: ErrorPerspectiveStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  });
  const peopleRef = useRef<Person[]>([]);
  const animFrameId = useRef<number | null>(null);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Initialize people
  useEffect(() => {
    const initialPeople: Person[] = DEFAULT_PEOPLE_CONFIGS.map((outfit, index) => {
      const initialPositions = [
        { x: 0.30, y: 0.72 },
        { x: 0.45, y: 0.30 },
        { x: 0.60, y: 0.26 },
        { x: 0.72, y: 0.34 },
        { x: 0.80, y: 0.80 },
        { x: 0.88, y: 0.86 },
        { x: 0.84, y: 0.12 },
      ];

      const pos = initialPositions[index % initialPositions.length];
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.5;

      return {
        x: pos.x,
        y: pos.y,
        speed: 0.0003 + Math.random() * 0.0002,
        angle,
        walkCycle: Math.random() * Math.PI * 2,
        walkSpeed: 0.08 + Math.random() * 0.03,
        outfit,
        targetX: Math.random(),
        targetY: Math.random() * 0.88 + 0.06,
        size: 32,
      };
    });

    peopleRef.current = initialPeople;
  }, []);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min(time - lastTime, 64);
      lastTime = time;

      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.04;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.04;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Dedicated Pure Midnight Palette (#0A0908)
      ctx.fillStyle = "#0A0908";
      ctx.fillRect(0, 0, width, height);

      // Perspective horizon setup
      const horizonY = height * 0.16;
      const fov = Math.max(height * 0.8, 380);
      const isMobile = width < 640;
      const tiltX = (mousePos.current.x - 0.5) * (width * (isMobile ? 0.02 : 0.04));
      const tiltY = (mousePos.current.y - 0.5) * (isMobile ? 6 : 12);
      const vanishX = width * 0.5 + tiltX;
      const vanishY = horizonY + tiltY;

      const project = (floorX: number, floorDepth: number) => {
        const z = 0.04 + floorDepth * 0.96;
        const screenY = vanishY + (height - vanishY) * Math.pow(z, 1.45);
        const spread = (screenY - vanishY) / fov;
        const screenX = vanishX + (floorX - 0.5) * width * 1.65 * (0.22 + spread * 1.5);
        return {
          x: screenX,
          y: screenY,
          scale: Math.max(0.28, Math.min(1.2, (0.32 + Math.pow(z, 1.1) * 0.95) * (isMobile ? 0.72 : 1))),
        };
      };

      // 1. Perspective grid lines
      ctx.lineWidth = 1;

      // Longitudinal lines
      const numLongLines = isMobile ? 14 : 22;
      for (let i = 0; i <= numLongLines; i++) {
        const floorX = (i / numLongLines) * 1.7 - 0.35;
        const pStart = project(floorX, 0.01);
        const pEnd = project(floorX, 1.05);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.075)";
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      }

      // Transverse lines
      const numTransLines = isMobile ? 12 : 18;
      for (let j = 0; j <= numTransLines; j++) {
        const floorDepth = Math.pow(j / numTransLines, 1.6);
        const pLeft = project(-0.35, floorDepth);
        const pRight = project(1.35, floorDepth);

        const alpha = Math.min(1, floorDepth * 1.35);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.07 * alpha})`;

        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
      }

      // Warm Cosmic Glow
      const glowGrad = ctx.createRadialGradient(
        vanishX, vanishY, 8,
        vanishX, vanishY + 100, Math.max(width * 0.55, 300)
      );
      glowGrad.addColorStop(0, "rgba(255, 107, 26, 0.12)");
      glowGrad.addColorStop(0.5, "rgba(217, 164, 65, 0.035)");
      glowGrad.addColorStop(1, "rgba(10, 9, 8, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animate and draw people
      const people = peopleRef.current;

      people.forEach((p) => {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.05 || Math.random() < 0.003) {
          p.targetX = 0.08 + Math.random() * 0.84;
          p.targetY = 0.06 + Math.random() * 0.86;
        }

        const desiredAngle = Math.atan2(dy, dx);
        let angleDiff = desiredAngle - p.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        p.angle += angleDiff * 0.035;

        p.x += Math.cos(p.angle) * p.speed * (delta / 16);
        p.y += Math.sin(p.angle) * p.speed * (delta / 16);

        if (p.x < 0.04) { p.x = 0.04; p.targetX = 0.5 + Math.random() * 0.4; }
        if (p.x > 0.96) { p.x = 0.96; p.targetX = 0.1 + Math.random() * 0.4; }
        if (p.y < 0.04) { p.y = 0.04; p.targetY = 0.5 + Math.random() * 0.4; }
        if (p.y > 0.96) { p.y = 0.96; p.targetY = 0.2 + Math.random() * 0.4; }

        p.walkCycle += p.walkSpeed * (delta / 16);
      });

      const sortedPeople = [...people].sort((a, b) => a.y - b.y);

      sortedPeople.forEach((p) => {
        const { x: px, y: py, scale } = project(p.x, p.y);
        const personWidth = 32 * scale;

        const cycle = p.walkCycle;
        const legSwing = Math.sin(cycle) * 0.45;
        const armSwing = Math.cos(cycle) * 0.4;
        const bobbing = Math.abs(Math.sin(cycle * 2)) * (2.5 * scale);

        // Contact shadow
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, 0.4);
        ctx.rotate(-0.35);
        const shadowGrad = ctx.createRadialGradient(0, 0, 2 * scale, 0, 0, 18 * scale);
        shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.8)");
        shadowGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.35)");
        shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(4 * scale, 0, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Figure
        ctx.save();
        ctx.translate(px, py - bobbing);

        const { outfit } = p;
        const isFacingDown = Math.sin(p.angle) >= 0;

        // Legs
        const legW = 5.2 * scale;
        const legH = 28 * scale;
        const leftLegOffset = legSwing * (12 * scale);
        const rightLegOffset = -legSwing * (12 * scale);

        ctx.fillStyle = outfit.pantsColor;

        ctx.beginPath();
        ctx.roundRect(-personWidth * 0.22, -legH + leftLegOffset * 0.3, legW, legH, 2 * scale);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(personWidth * 0.08, -legH + rightLegOffset * 0.3, legW, legH, 2 * scale);
        ctx.fill();

        // Shoes
        ctx.fillStyle = outfit.shoesColor;
        ctx.beginPath();
        ctx.ellipse(-personWidth * 0.22 + legW * 0.5, -1, 3.5 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(personWidth * 0.08 + legW * 0.5, -1, 3.5 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Torso
        const torsoY = -legH - 24 * scale;
        const torsoW = 16 * scale;
        const torsoH = 26 * scale;

        ctx.fillStyle = outfit.shirtColor;
        ctx.beginPath();
        ctx.roundRect(-torsoW / 2, torsoY, torsoW, torsoH, [4 * scale, 4 * scale, 2 * scale, 2 * scale]);
        ctx.fill();

        // Arms
        const armW = 4.2 * scale;
        const armH = 20 * scale;
        ctx.fillStyle = outfit.style === "tshirt" ? outfit.skinTone : outfit.shirtColor;

        // Left arm
        ctx.save();
        ctx.translate(-torsoW / 2 - armW * 0.4, torsoY + 2 * scale);
        ctx.rotate(armSwing * 0.5);
        ctx.beginPath();
        ctx.roundRect(-armW / 2, 0, armW, armH, 2 * scale);
        ctx.fill();
        ctx.fillStyle = outfit.skinTone;
        ctx.beginPath();
        ctx.arc(0, armH, 2.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(torsoW / 2 + armW * 0.4, torsoY + 2 * scale);
        ctx.rotate(-armSwing * 0.5);
        ctx.fillStyle = outfit.style === "tshirt" ? outfit.skinTone : outfit.shirtColor;
        ctx.beginPath();
        ctx.roundRect(-armW / 2, 0, armW, armH, 2 * scale);
        ctx.fill();
        ctx.fillStyle = outfit.skinTone;
        ctx.beginPath();
        ctx.arc(0, armH, 2.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Head
        const headRadius = 6.2 * scale;
        const headY = torsoY - headRadius - 1.5 * scale;

        ctx.fillStyle = outfit.skinTone;
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = outfit.hairColor;
        ctx.beginPath();
        if (isFacingDown) {
          ctx.arc(0, headY - 1.2 * scale, headRadius * 0.95, Math.PI * 0.9, Math.PI * 2.1);
        } else {
          ctx.arc(0, headY, headRadius * 1.02, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.restore();
      });

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Mouse & Touch interaction
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      mousePos.current.targetX = e.clientX / window.innerWidth;
      mousePos.current.targetY = e.clientY / window.innerHeight;
    },
    [interactive]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    // If user tapped a button or link, don't trigger ripple
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input")) {
      return;
    }

    const clickX = e.clientX / window.innerWidth;
    const clickY = e.clientY / window.innerHeight;

    setClickRipple({ x: e.clientX, y: e.clientY, id: Date.now() });
    setTimeout(() => setClickRipple(null), 800);

    if (peopleRef.current.length > 0) {
      let closestPerson = peopleRef.current[0];
      let minDistance = 999;

      peopleRef.current.forEach((p) => {
        const d = Math.hypot(p.x - clickX, p.y - clickY);
        if (d < minDistance) {
          minDistance = d;
          closestPerson = p;
        }
      });

      closestPerson.targetX = clickX;
      closestPerson.targetY = Math.max(0.08, Math.min(0.92, clickY));
      closestPerson.speed *= 1.35;
      setTimeout(() => {
        closestPerson.speed /= 1.35;
      }, 3500);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      className={`relative w-full min-h-[100dvh] bg-[#0A0908] text-stone-100 flex flex-col items-center justify-center overflow-x-hidden select-none cursor-default ${className}`}
    >
      {/* Background Interactive Floor Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Ripple on floor click */}
      {clickRipple && (
        <span
          className="fixed pointer-events-none rounded-full border border-orange-400/50 animate-ping z-0"
          style={{
            left: clickRipple.x - 20,
            top: clickRipple.y - 20,
            width: 40,
            height: 40,
          }}
        />
      )}

      {/* Foreground Content */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-8 sm:px-6 sm:py-12 flex flex-col items-center justify-center text-center pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
