"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Layers, Info } from "lucide-react";
import type { PathResult } from "@/lib/wayfinding";

export interface Venue3DProps {
  svgContent: string;
  highlightZoneId?: string | null;
  selectedZoneId?: string | null;
  userWaypointId?: string;
  activeRoute?: PathResult | null;
  onSelectZone?: (zoneId: string) => void;
  onFallback2D?: () => void;
}

interface ExtrudedRoom {
  id: string;
  label: string;
  geometry: THREE.ExtrudeGeometry;
  center: THREE.Vector3;
  type: "hall" | "room" | "corridor" | "amenity" | "other";
  floor: number;
  color?: string;
}

// Extract element id safely from SVGElement or its parent group
function getElementId(node: SVGElement | undefined): string {
  if (!node) return "";
  const directId =
    node.getAttribute?.("id") ||
    (typeof node.id === "string" ? node.id : (node.id as any)?.baseVal) ||
    "";
  if (directId) return directId;

  // Check parent group if direct node has no id (e.g. <g id="amenity-restroom-1"><circle .../></g>)
  let parent = node.parentElement;
  while (parent && parent.nodeName.toLowerCase() !== "svg") {
    const parentId =
      parent.getAttribute?.("id") ||
      (typeof parent.id === "string" ? parent.id : (parent.id as any)?.baseVal) ||
      "";
    if (
      parentId &&
      parentId !== "amenities" &&
      parentId !== "waypoints" &&
      !parentId.startsWith("zone-group")
    ) {
      return parentId;
    }
    parent = parent.parentElement;
  }
  return "";
}

// Clean and humanize room and zone IDs for labels
function cleanRoomLabel(id: string): string {
  const clean = id
    .replace(/^amenity-/, "")
    .replace(/^wp-/, "")
    .replace(/-/g, " ");

  const lower = clean.toLowerCase();
  if (lower.includes("entrance")) return "Entrance";
  if (lower.includes("food")) return "Dining Area";
  if (lower.includes("sponsor")) return "Sponsor Booths";

  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Check WebGL availability
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// Canvas rounded rectangle helper with fallback
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
}

// Generate dynamic canvas texture for floating room labels
function createRoomLabelTexture(
  label: string,
  isHighlighted: boolean,
  isAssigned: boolean
): { texture: THREE.CanvasTexture; aspect: number } | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = 2;
  const fontSize = 24 * dpr;
  const subFontSize = 14 * dpr;
  const padX = 24 * dpr;
  const padY = 14 * dpr;

  ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const mainMetrics = ctx.measureText(label);

  let subMetricsWidth = 0;
  if (isAssigned) {
    ctx.font = `bold ${subFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    subMetricsWidth = ctx.measureText("★ ASSIGNED").width;
  }

  const textWidth = Math.max(mainMetrics.width, subMetricsWidth);
  const canvasWidth = Math.ceil(textWidth + padX * 2);
  const canvasHeight = Math.ceil(fontSize + (isAssigned ? subFontSize + 8 * dpr : 0) + padY * 2);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const radius = 12 * dpr;

  ctx.save();
  ctx.beginPath();
  drawRoundedRect(ctx, 2, 2, canvasWidth - 4, canvasHeight - 4, radius);

  if (isHighlighted) {
    ctx.fillStyle = "#FF6B1A";
    ctx.fill();
    ctx.lineWidth = 3 * dpr;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(11, 10, 10, 0.90)";
    ctx.fill();
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = "rgba(75, 85, 99, 0.85)";
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (isAssigned) {
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(label, canvasWidth / 2, padY + fontSize * 0.45);

    ctx.font = `bold ${subFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isHighlighted ? "#FEF08A" : "#FBBF24";
    ctx.fillText("★ ASSIGNED", canvasWidth / 2, canvasHeight - padY - subFontSize * 0.45);
  } else {
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isHighlighted ? "#FFFFFF" : "#E2E8F0";
    ctx.fillText(label, canvasWidth / 2, canvasHeight / 2);
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const aspect = canvasWidth / canvasHeight;
  return { texture, aspect };
}

// Generate dynamic canvas texture for "You Are Here" billboard
function createYouAreHereTexture(): { texture: THREE.CanvasTexture; aspect: number } | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = 2;
  const fontSize = 20 * dpr;
  const padX = 20 * dpr;
  const padY = 12 * dpr;
  const text = "YOU ARE HERE";

  ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
  const metrics = ctx.measureText(text);

  const canvasWidth = Math.ceil(metrics.width + padX * 2);
  const canvasHeight = Math.ceil(fontSize + padY * 2);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const radius = 8 * dpr;

  ctx.save();
  ctx.beginPath();
  drawRoundedRect(ctx, 2, 2, canvasWidth - 4, canvasHeight - 4, radius);

  ctx.fillStyle = "rgba(11, 10, 10, 0.95)";
  ctx.fill();

  ctx.lineWidth = 2.5 * dpr;
  ctx.strokeStyle = "#00E5FF";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
  ctx.fillStyle = "#00E5FF";
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const aspect = canvasWidth / canvasHeight;
  return { texture, aspect };
}

// Native WebGL 3D Billboard Sprite for room labels (zero DOM overhead, immune to React unmount errors)
function RoomLabelSprite({
  label,
  position,
  isHighlighted,
  isAssigned,
  onClick,
}: {
  label: string;
  position: [number, number, number];
  isHighlighted: boolean;
  isAssigned: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const result = useMemo(() => {
    return createRoomLabelTexture(label, isHighlighted, isAssigned);
  }, [label, isHighlighted, isAssigned]);

  useEffect(() => {
    return () => {
      if (result) {
        result.texture.dispose();
      }
    };
  }, [result]);

  if (!result) return null;

  const height = isHighlighted ? 6.5 : 4.8;
  const width = height * result.aspect;

  return (
    <sprite
      position={position}
      scale={[width, height, 1]}
      renderOrder={isHighlighted ? 200 : 100}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (typeof document !== "undefined") document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (typeof document !== "undefined") document.body.style.cursor = "auto";
      }}
    >
      <spriteMaterial
        map={result.texture}
        transparent
        depthTest={true}
        depthWrite={false}
      />
    </sprite>
  );
}

// Native WebGL 3D Beacon for "You Are Here" (glowing inverted pin, concentric animated ground ripples, billboard banner)
function YouAreHereBeacon({ position }: { position: THREE.Vector3 }) {
  const beaconGroupRef = useRef<THREE.Group>(null);
  const rippleRingRef = useRef<THREE.Mesh>(null);
  const rippleRing2Ref = useRef<THREE.Mesh>(null);

  const bannerResult = useMemo(() => {
    return createYouAreHereTexture();
  }, []);

  useEffect(() => {
    return () => {
      if (bannerResult) {
        bannerResult.texture.dispose();
      }
    };
  }, [bannerResult]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Bobbing pin animation
    if (beaconGroupRef.current) {
      beaconGroupRef.current.position.y = 5.5 + Math.sin(t * 3.5) * 0.9;
    }

    // Concentric expanding ripples on ground
    if (rippleRingRef.current) {
      const p1 = (t * 0.8) % 1;
      const s1 = 1 + p1 * 1.6;
      rippleRingRef.current.scale.set(s1, s1, 1);
      const mat = rippleRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, 0.7 * (1 - p1));
    }

    if (rippleRing2Ref.current) {
      const p2 = ((t * 0.8) + 0.5) % 1;
      const s2 = 1 + p2 * 1.6;
      rippleRing2Ref.current.scale.set(s2, s2, 1);
      const mat = rippleRing2Ref.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, 0.7 * (1 - p2));
    }
  });

  const bannerHeight = 4.2;
  const bannerWidth = bannerResult ? bannerHeight * bannerResult.aspect : 15;

  return (
    <group position={position}>
      {/* Ground Concentric Ripples */}
      <mesh
        ref={rippleRingRef}
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.5, 4.5, 32]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.7} />
      </mesh>
      <mesh
        ref={rippleRing2Ref}
        position={[0, 0.25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.5, 4.5, 32]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.7} />
      </mesh>

      {/* Floating Animated Pin Pointer */}
      <group ref={beaconGroupRef}>
        {/* Inverted cone pointer */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[2.2, 5.5, 16]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={1.4}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>

        {/* Glowing Orb on Top */}
        <mesh position={[0, 3.8, 0]}>
          <sphereGeometry args={[2.2, 16, 16]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={1.6}
            roughness={0.1}
          />
        </mesh>

        {/* Billboard Banner */}
        {bannerResult && (
          <sprite
            position={[0, 8.5, 0]}
            scale={[bannerWidth, bannerHeight, 1]}
            renderOrder={300}
          >
            <spriteMaterial
              map={bannerResult.texture}
              transparent
              depthTest={false}
              depthWrite={false}
            />
          </sprite>
        )}
      </group>
    </group>
  );
}

// ==================== 3D SCENE CONTENT ====================
function Venue3DScene({
  rooms,
  highlightZoneId,
  selectedZoneId,
  userWaypointId,
  activeRoute,
  activeFloor,
  centerSvgX,
  centerSvgY,
  svgWidth,
  svgHeight,
  svgContent,
  onSelectZone,
}: {
  rooms: ExtrudedRoom[];
  highlightZoneId?: string | null;
  selectedZoneId?: string | null;
  userWaypointId?: string;
  activeRoute?: PathResult | null;
  activeFloor: number | "ALL";
  centerSvgX: number;
  centerSvgY: number;
  svgWidth: number;
  svgHeight: number;
  svgContent: string;
  onSelectZone?: (zoneId: string) => void;
}) {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  // Filter rooms by floor
  const visibleRooms = useMemo(() => {
    if (activeFloor === "ALL") return rooms;
    return rooms.filter((r) => r.floor === activeFloor);
  }, [rooms, activeFloor]);

  // Pulsing material for the assigned / selected room
  const pulseMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (pulseMaterialRef.current) {
      const t = (1 + Math.sin(state.clock.elapsedTime * 4.5)) * 0.5;
      pulseMaterialRef.current.emissiveIntensity = 0.5 + t * 0.9;
    }
  });

  // Calculate 3D Curve along active route
  const routeCurve = useMemo(() => {
    if (!activeRoute || !activeRoute.found || !activeRoute.nodes || activeRoute.nodes.length < 2) {
      return null;
    }

    // Convert 2D SVG coords to the centered 3D coordinate space
    const points = activeRoute.nodes.map((n) => {
      return new THREE.Vector3(
        n.x - centerSvgX,
        4.0 + (n.floor - 1) * 20,
        n.y - centerSvgY
      );
    });

    return new THREE.CatmullRomCurve3(points);
  }, [activeRoute, centerSvgX, centerSvgY]);

  // Animated walker position along the route tube
  const walkerRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (walkerRef.current && routeCurve) {
      const progress = (state.clock.elapsedTime * 0.22) % 1;
      const point = routeCurve.getPointAt(progress);
      walkerRef.current.position.copy(point);
      walkerRef.current.position.y += 1.2;
    }
  });

  // Find user waypoint 3D position
  const userWaypointPos = useMemo(() => {
    if (!userWaypointId) return null;

    // 1. If activeRoute exists and starts with this waypoint, use its coordinates
    if (activeRoute?.nodes && activeRoute.nodes.length > 0) {
      const firstNode = activeRoute.nodes[0];
      if (firstNode.id === userWaypointId) {
        return new THREE.Vector3(
          firstNode.x - centerSvgX,
          3.5 + (firstNode.floor - 1) * 20,
          firstNode.y - centerSvgY
        );
      }
    }

    // 2. Try to find the waypoint coordinates in svgContent directly
    try {
      const circleRegex = new RegExp(
        `<circle[^>]*id=["']${userWaypointId}["'][^>]*>`,
        "i"
      );
      const m = svgContent.match(circleRegex);
      if (m) {
        const cxMatch = m[0].match(/cx=["']([0-9.-]+)["']/i);
        const cyMatch = m[0].match(/cy=["']([0-9.-]+)["']/i);
        if (cxMatch && cyMatch) {
          const cx = parseFloat(cxMatch[1]);
          const cy = parseFloat(cyMatch[1]);
          return new THREE.Vector3(cx - centerSvgX, 3.5, cy - centerSvgY);
        }
      }
    } catch {
      // fallback
    }

    // 3. Try to match a room
    const cleanId = userWaypointId.replace(/^wp-/, "");
    const matchingRoom = rooms.find((r) => r.id === cleanId || r.id.includes(cleanId));
    if (matchingRoom) {
      const yOffset = (matchingRoom.floor - 1) * 20;
      return new THREE.Vector3(matchingRoom.center.x, 3.5 + yOffset, matchingRoom.center.z);
    }

    return new THREE.Vector3(0, 3.5, 0);
  }, [userWaypointId, rooms, activeRoute, svgContent, centerSvgX, centerSvgY]);

  // Check if user waypoint is visible on the current floor selection
  const isUserWaypointVisible = useMemo(() => {
    if (!userWaypointPos) return false;
    if (activeFloor === "ALL") return true;
    const cleanId = (userWaypointId || "").replace(/^wp-/, "");
    const matchingRoom = rooms.find((r) => r.id === cleanId || r.id.includes(cleanId));
    if (matchingRoom) return matchingRoom.floor === activeFloor;
    if (activeRoute?.nodes && activeRoute.nodes.length > 0) {
      return activeRoute.nodes[0].floor === activeFloor;
    }
    return true;
  }, [userWaypointPos, activeFloor, userWaypointId, rooms, activeRoute]);

  const plateWidth = Math.max(svgWidth, 800) + 300;
  const plateHeight = Math.max(svgHeight, 600) + 300;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[200, 350, 200]} intensity={1.4} castShadow />
      <directionalLight position={[-200, 250, -200]} intensity={0.8} />
      <pointLight position={[0, 200, 0]} intensity={1.2} distance={800} />

      {/* Ground Floor Plate */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[plateWidth, 1, plateHeight]} />
        <meshStandardMaterial color="#0B0A0A" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Grid Pattern on Ground */}
      <gridHelper
        args={[Math.max(plateWidth, plateHeight), 50, "#FF6B1A", "#1C1917"]}
        position={[0, 0.02, 0]}
      />

      {/* Extruded Rooms */}
      {visibleRooms.map((room) => {
        const isAssigned = room.id === highlightZoneId;
        const isSelected = room.id === selectedZoneId;
        const isHighlighted = isAssigned || isSelected;

        let baseColor = room.color || "#1E293B";
        if (!room.color) {
          if (room.type === "corridor") baseColor = "#18181B";
          else if (room.type === "amenity") baseColor = "#0E7490";
          else if (room.type === "hall") baseColor = "#334155";
        }

        const yOffset = (room.floor - 1) * 20;

        return (
          <group key={room.id} position={[0, yOffset, 0]}>
            <mesh
              name={room.id}
              geometry={room.geometry}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectZone) onSelectZone(room.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                if (typeof document !== "undefined") document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                if (typeof document !== "undefined") document.body.style.cursor = "auto";
              }}
            >
              {isHighlighted ? (
                <meshStandardMaterial
                  ref={isAssigned ? pulseMaterialRef : undefined}
                  color="#FF6B1A"
                  emissive="#FF6B1A"
                  emissiveIntensity={0.8}
                  roughness={0.3}
                  metalness={0.2}
                  side={THREE.DoubleSide}
                />
              ) : (
                <meshStandardMaterial
                  color={baseColor}
                  roughness={0.5}
                  metalness={0.2}
                  side={THREE.DoubleSide}
                />
              )}
            </mesh>

            {/* Native 3D Billboard Sprite Room Label */}
            {(room.type === "hall" || room.type === "amenity" || isHighlighted) && (
              <RoomLabelSprite
                label={room.label}
                position={[
                  room.center.x,
                  room.center.y + (isHighlighted ? 12 : 9),
                  room.center.z,
                ]}
                isHighlighted={isHighlighted}
                isAssigned={isAssigned}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectZone) onSelectZone(room.id);
                }}
              />
            )}
          </group>
        );
      })}

      {/* "You Are Here" 3D Beacon (Pure WebGL Geometry & Billboard Sprite) */}
      {userWaypointPos && isUserWaypointVisible && (
        <YouAreHereBeacon position={userWaypointPos} />
      )}

      {/* Glowing 3D Tube Route */}
      {routeCurve && (
        <group>
          {/* Main glowing tube */}
          <mesh>
            <tubeGeometry args={[routeCurve, 64, 1.2, 8, false]} />
            <meshStandardMaterial
              color="#FF6B1A"
              emissive="#FF6B1A"
              emissiveIntensity={1.5}
              roughness={0.2}
            />
          </mesh>

          {/* Animated Walker Sphere */}
          <mesh ref={walkerRef}>
            <sphereGeometry args={[2.2, 16, 16]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFE5D4"
              emissiveIntensity={1.8}
            />
          </mesh>
        </group>
      )}

      {/* Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2 - 0.05} // Do not dip below ground plane
        minDistance={50}
        maxDistance={2500}
      />
    </>
  );
}

// ==================== MAIN VENUE 3D COMPONENT ====================
export default function Venue3D({
  svgContent,
  highlightZoneId,
  selectedZoneId,
  userWaypointId,
  activeRoute,
  onSelectZone,
  onFallback2D,
}: Venue3DProps) {
  const [activeFloor, setActiveFloor] = useState<number | "ALL">("ALL");
  const [webGLSupported] = useState<boolean>(() => isWebGLAvailable());

  // Compute SVG viewBox dimensions to properly center 3D coordinates
  const { svgWidth, svgHeight, centerSvgX, centerSvgY } = useMemo(() => {
    if (!svgContent) {
      return { svgWidth: 1000, svgHeight: 800, centerSvgX: 500, centerSvgY: 400 };
    }
    const viewBoxMatch = svgContent.match(
      /viewBox=["']\s*([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s*["']/i
    );
    let w = 1000;
    let h = 800;
    if (viewBoxMatch) {
      w = parseFloat(viewBoxMatch[3]) || 1000;
      h = parseFloat(viewBoxMatch[4]) || 800;
    }
    return {
      svgWidth: w,
      svgHeight: h,
      centerSvgX: w / 2,
      centerSvgY: h / 2,
    };
  }, [svgContent]);

  // Parse SVG and generate extruded room geometries
  const rooms = useMemo(() => {
    if (!svgContent) return [];

    try {
      // Pre-sanitize unescaped ampersands so DOMParser inside SVGLoader won't choke with XML parsererror
      const cleanSvg = svgContent.replace(
        /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g,
        "&amp;"
      );

      const loader = new SVGLoader();
      const svgData = loader.parse(cleanSvg);

      if (svgData.xml && svgData.xml.nodeName.toLowerCase() === "parsererror") {
        console.warn("SVG parser error:", svgData.xml.textContent);
      }

      const parsedRooms: ExtrudedRoom[] = [];

      for (const path of svgData.paths) {
        const node = path.userData?.node as SVGElement | undefined;
        const id = getElementId(node);
        if (!id || id.startsWith("wp-")) continue; // Skip waypoint nodes from room extrusion

        const shapes = SVGLoader.createShapes(path);
        if (!shapes || shapes.length === 0) continue;

        const isHall =
          id.startsWith("hall-") ||
          id.startsWith("room-") ||
          id.startsWith("lab-") ||
          id.includes("auditorium") ||
          id.includes("arena") ||
          id.includes("conference") ||
          id.includes("booth");

        const isCorridor = id.startsWith("corridor-") || id.startsWith("path-");

        const isAmenity =
          id.startsWith("amenity-") ||
          id.includes("food") ||
          id.includes("restroom") ||
          id.includes("water") ||
          id.includes("helpdesk") ||
          id.includes("first-aid") ||
          id.includes("entrance") ||
          id.includes("registration");

        const depth = isHall ? 12 : isAmenity ? 8 : isCorridor ? 2.5 : 7;

        let roomColor: string | undefined;
        if (path.color) {
          const hex = path.color.getHexString();
          if (hex && hex !== "000000") {
            roomColor = `#${hex}`;
          }
        }

        for (const shape of shapes) {
          try {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth,
              bevelEnabled: true,
              bevelSegments: 2,
              steps: 1,
              bevelSize: 0.4,
              bevelThickness: 0.4,
            });

            // 1. Lie flat on X-Z floor plane
            geometry.rotateX(Math.PI / 2);

            // 2. Extrude UPWARDS from floor y=0 to y=depth
            geometry.scale(1, -1, 1);
            geometry.computeVertexNormals();

            // 3. Center geometry on the 3D ground plane relative to the SVG viewBox
            geometry.translate(-centerSvgX, 0, -centerSvgY);

            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox!;
            const center = new THREE.Vector3();
            bbox.getCenter(center);

            const label = cleanRoomLabel(id);

            // Floor level: default 1, Floor 2 if id indicates
            const floor = id.includes("floor-2") || id.includes("floor2") || id.includes("f2") ? 2 : 1;

            parsedRooms.push({
              id,
              label,
              geometry,
              center,
              type: isHall ? "hall" : isCorridor ? "corridor" : isAmenity ? "amenity" : "other",
              floor,
              color: roomColor,
            });
          } catch {
            // Skip invalid or non-manifold SVG path shapes gracefully
          }
        }
      }

      return parsedRooms;
    } catch (err) {
      console.error("Error parsing SVG into 3D geometries:", err);
      return [];
    }
  }, [svgContent, centerSvgX, centerSvgY]);

  // Clean up WebGL room geometries on unmount / change
  useEffect(() => {
    return () => {
      rooms.forEach((r) => {
        try {
          r.geometry.dispose();
        } catch {
          // ignore
        }
      });
    };
  }, [rooms]);

  if (!webGLSupported) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0B0A0A] text-stone-200 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white mb-1">3D Graphics Hardware Acceleration Unavailable</h3>
          <p className="text-xs text-stone-400 max-w-sm">
            Your browser or device does not have WebGL acceleration enabled. Switching back to high-resolution 2D blueprint.
          </p>
        </div>
        {onFallback2D && (
          <button
            type="button"
            onClick={onFallback2D}
            className="px-4 py-2 rounded-xl bg-[#FF6B1A] hover:bg-[#E8551F] text-white text-xs font-bold transition"
          >
            Switch to 2D Blueprint
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0B0A0A] overflow-hidden select-none">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [0, Math.max(svgHeight, 600) * 0.75, Math.max(svgHeight, 600) * 0.9],
          fov: 45,
          near: 1,
          far: 5000,
        }}
        style={{ background: "#0B0A0A" }}
      >
        <Venue3DScene
          rooms={rooms}
          highlightZoneId={highlightZoneId}
          selectedZoneId={selectedZoneId}
          userWaypointId={userWaypointId}
          activeRoute={activeRoute}
          activeFloor={activeFloor}
          centerSvgX={centerSvgX}
          centerSvgY={centerSvgY}
          svgWidth={svgWidth}
          svgHeight={svgHeight}
          svgContent={svgContent}
          onSelectZone={onSelectZone}
        />
      </Canvas>

      {/* Floating 3D Navigation Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {/* Floor Level Selector */}
        <div className="flex items-center p-1 bg-[#141212]/90 backdrop-blur-md border border-stone-800 rounded-xl text-xs font-semibold shadow-xl">
          <span className="text-[10px] uppercase font-bold text-stone-400 px-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#FF6B1A]" />
            <span>Floor:</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveFloor("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeFloor === "ALL"
                ? "bg-[#FF6B1A] text-white"
                : "text-stone-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFloor(1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeFloor === 1
                ? "bg-[#FF6B1A] text-white"
                : "text-stone-400 hover:text-white"
            }`}
          >
            Floor 1
          </button>
          <button
            type="button"
            onClick={() => setActiveFloor(2)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeFloor === 2
                ? "bg-[#FF6B1A] text-white"
                : "text-stone-400 hover:text-white"
            }`}
          >
            Floor 2
          </button>
        </div>
      </div>

      {/* Interaction Hint in bottom right */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:block">
        <div className="bg-[#141212]/90 backdrop-blur-md border border-stone-800/80 px-3 py-1.5 rounded-xl text-[10px] text-stone-400 font-mono shadow-xl flex items-center gap-2">
          <span>Rotate: Left Click + Drag</span>
          <span>•</span>
          <span>Pan: Right Click + Drag</span>
          <span>•</span>
          <span>Zoom: Scroll</span>
        </div>
      </div>
    </div>
  );
}
