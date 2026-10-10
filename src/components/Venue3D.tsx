"use client";

import { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
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

// ==================== 3D SCENE CONTENT ====================
function Venue3DScene({
  rooms,
  highlightZoneId,
  selectedZoneId,
  userWaypointId,
  activeRoute,
  activeFloor,
  onSelectZone,
}: {
  rooms: ExtrudedRoom[];
  highlightZoneId?: string | null;
  selectedZoneId?: string | null;
  userWaypointId?: string;
  activeRoute?: PathResult | null;
  activeFloor: number | "ALL";
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
      pulseMaterialRef.current.emissiveIntensity = 0.4 + t * 0.8;
    }
  });

  // Calculate 3D Curve along active route
  const routeCurve = useMemo(() => {
    if (!activeRoute || !activeRoute.found || !activeRoute.nodes || activeRoute.nodes.length < 2) {
      return null;
    }

    // Convert 2D SVG coords to the centered 3D coordinate space
    const points = activeRoute.nodes.map((n) => {
      // SVG coords are mapped into centered 3D space: x -> x, y -> -z
      return new THREE.Vector3(n.x, 3.2 + (n.floor - 1) * 20, n.y);
    });

    return new THREE.CatmullRomCurve3(points);
  }, [activeRoute]);

  // Animated walker position along the route tube
  const walkerRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (walkerRef.current && routeCurve) {
      const progress = (state.clock.elapsedTime * 0.22) % 1;
      const point = routeCurve.getPointAt(progress);
      walkerRef.current.position.copy(point);
      walkerRef.current.position.y += 0.8;
    }
  });

  // Find user waypoint 3D position
  const userWaypointPos = useMemo(() => {
    if (!userWaypointId) return null;
    const cleanId = userWaypointId.replace(/^wp-/, "");
    const matchingRoom = rooms.find((r) => r.id === cleanId || r.id.includes(cleanId));
    if (matchingRoom) {
      return new THREE.Vector3(matchingRoom.center.x, 3.5, matchingRoom.center.z);
    }
    return new THREE.Vector3(100, 3.5, 500);
  }, [userWaypointId, rooms]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[150, 250, 150]} intensity={1.2} castShadow />
      <directionalLight position={[-150, 150, -150]} intensity={0.6} />
      <pointLight position={[0, 100, 0]} intensity={1.0} distance={400} />

      {/* Ground Floor Plate */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[1200, 1, 1000]} />
        <meshStandardMaterial color="#0B0A0A" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Grid Pattern on Ground */}
      <gridHelper
        args={[1200, 60, "#FF6B1A", "#1C1917"]}
        position={[0, 0.05, 0]}
      />

      {/* Extruded Rooms */}
      {visibleRooms.map((room) => {
        const isAssigned = room.id === highlightZoneId;
        const isSelected = room.id === selectedZoneId;
        const isHighlighted = isAssigned || isSelected;

        let baseColor = "#1E293B";
        if (room.type === "corridor") baseColor = "#18181B";
        else if (room.type === "amenity") baseColor = "#0E7490";
        else if (room.type === "hall") baseColor = "#334155";

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
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
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
                />
              ) : (
                <meshStandardMaterial
                  color={baseColor}
                  roughness={0.6}
                  metalness={0.2}
                />
              )}
            </mesh>

            {/* Floating Room Label (Halls and Amenities only) */}
            {(room.type === "hall" || room.type === "amenity" || isHighlighted) && (
              <Html
                position={[room.center.x, room.center.y + (room.type === "hall" ? 7 : 4), room.center.z]}
                center
                distanceFactor={180}
              >
                <div
                  className={`pointer-events-none select-none px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl transition-transform ${
                    isHighlighted
                      ? "bg-[#FF6B1A] text-white border border-white/40 ring-4 ring-[#FF6B1A]/30 scale-110"
                      : "bg-[#0B0A0A]/90 text-stone-200 border border-stone-700/80"
                  }`}
                >
                  <span className="block">{room.label}</span>
                  {isAssigned && (
                    <span className="text-[8px] uppercase tracking-wider block opacity-90 text-amber-200">
                      ★ Assigned
                    </span>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* "You Are Here" 3D Marker */}
      {userWaypointPos && (
        <group position={userWaypointPos}>
          <mesh position={[0, 4, 0]}>
            <sphereGeometry args={[2.5, 16, 16]} />
            <meshStandardMaterial
              color="#00E5FF"
              emissive="#00E5FF"
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3, 5, 32]} />
            <meshBasicMaterial color="#00E5FF" transparent opacity={0.6} />
          </mesh>
          <Html position={[0, 8, 0]} center distanceFactor={140}>
            <div className="bg-[#0B0A0A] text-[#00E5FF] border border-[#00E5FF] px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase whitespace-nowrap shadow-lg">
              You Are Here
            </div>
          </Html>
        </group>
      )}

      {/* Glowing 3D Tube Route */}
      {routeCurve && (
        <group>
          {/* Main glowing tube */}
          <mesh>
            <tubeGeometry args={[routeCurve, 64, 0.8, 8, false]} />
            <meshStandardMaterial
              color="#FF6B1A"
              emissive="#FF6B1A"
              emissiveIntensity={1.4}
              roughness={0.2}
            />
          </mesh>

          {/* Animated Walker Sphere */}
          <mesh ref={walkerRef}>
            <sphereGeometry args={[1.8, 16, 16]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFE5D4"
              emissiveIntensity={1.5}
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
        maxPolarAngle={Math.PI / 2 - 0.05} // Do not dip below ground plane
        minDistance={20}
        maxDistance={450}
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

  // Parse SVG and generate extruded room geometries
  const rooms = useMemo(() => {
    if (!svgContent) return [];

    try {
      const loader = new SVGLoader();
      const svgData = loader.parse(svgContent);

      const parsedRooms: ExtrudedRoom[] = [];

      for (const path of svgData.paths) {
        const node = path.userData?.node as SVGElement | undefined;
        const id = node?.id || "";
        if (!id || id.startsWith("wp-")) continue; // Skip waypoint nodes from room extrusion

        const shapes = SVGLoader.createShapes(path);

        const isHall = id.startsWith("hall-") || id.startsWith("room-") || id.startsWith("lab-");
        const isCorridor = id.startsWith("corridor-") || id.startsWith("path-");
        const isAmenity = id.startsWith("amenity-");

        const depth = isHall ? 6 : isCorridor ? 1.8 : isAmenity ? 4 : 3;

        for (const shape of shapes) {
          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.3,
            bevelThickness: 0.3,
          });

          // Rotate to lie flat on X-Z floor plane (SVG Y points down, in 3D we orient flat)
          geometry.rotateX(Math.PI / 2);

          geometry.computeBoundingBox();
          const bbox = geometry.boundingBox!;
          const center = new THREE.Vector3();
          bbox.getCenter(center);

          const label = id
            .replace(/^amenity-/, "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          // Floor level: default 1, Floor 2 if id indicates
          const floor = id.includes("floor-2") || id.includes("floor2") ? 2 : 1;

          parsedRooms.push({
            id,
            label,
            geometry,
            center,
            type: isHall ? "hall" : isCorridor ? "corridor" : isAmenity ? "amenity" : "other",
            floor,
          });
        }
      }

      return parsedRooms;
    } catch (err) {
      console.error("Error parsing SVG into 3D geometries:", err);
      return [];
    }
  }, [svgContent]);

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
        camera={{ position: [250, 280, 400], fov: 45, near: 1, far: 2000 }}
        style={{ background: "#0B0A0A" }}
      >
        <Venue3DScene
          rooms={rooms}
          highlightZoneId={highlightZoneId}
          selectedZoneId={selectedZoneId}
          userWaypointId={userWaypointId}
          activeRoute={activeRoute}
          activeFloor={activeFloor}
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
