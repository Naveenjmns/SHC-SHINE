"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  Layers,
  MapPin,
  Utensils,
  Droplets,
  HelpCircle,
  Compass,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Route,
  Navigation,
  Locate,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import type { PathResult, WaypointNode } from "@/lib/wayfinding";
import { safeJson } from "@/lib/safeFetch";
import dynamic from "next/dynamic";

const Venue3D = dynamic(() => import("@/components/Venue3D"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-3 z-20 bg-[#0B0A0A]">
      <div className="w-10 h-10 border-3 border-[#FF6B1A]/20 border-t-[#FF6B1A] rounded-full animate-spin" />
      <p className="text-xs font-semibold text-stone-400">Initializing 3D Venue Simulator...</p>
    </div>
  ),
});

export interface InteractiveFloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorPlanUrl?: string | null;
  highlightZoneId?: string | null;
  title?: string;
  subtitle?: string;
  initialFromWaypointId?: string | null;
}

type AmenityFilter = "ALL" | "RESTROOM" | "WATER" | "FOOD" | "HELPDESK";

export default function InteractiveFloorPlanModal({
  isOpen,
  onClose,
  floorPlanUrl = "/uploads/campus-floorplan.svg",
  highlightZoneId,
  title = "SHINE Indoor Venue Floor Plan",
  subtitle,
  initialFromWaypointId,
}: InteractiveFloorPlanModalProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const effectiveFloorPlanUrl = floorPlanUrl || "/uploads/campus-floorplan.svg";
  const loading = !svgContent || loadedUrl !== effectiveFloorPlanUrl;

  // Transform / Zoom / Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Touch pinch tracking
  const touchDistanceRef = useRef<number | null>(null);
  const touchScaleRef = useRef(1);

  // Amenity filters & UI state
  const [showAmenities, setShowAmenities] = useState(true);
  const [amenityFilter, setAmenityFilter] = useState<AmenityFilter>("ALL");
  const [hoveredZoneName, setHoveredZoneName] = useState<string | null>(null);
  const [clickedZoneId, setClickedZoneId] = useState<string | null>(null);
  const selectedZoneId = clickedZoneId || highlightZoneId || null;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"2D" | "3D">("2D");

  // DOM refs
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  // ==================== STEP 6: LOCATION & WAYFINDING STATE ====================
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const userWaypointId =
    selectedWaypointId ||
    initialFromWaypointId ||
    (typeof window !== "undefined" ? localStorage.getItem("shine_last_waypoint") || "wp-entrance" : "wp-entrance");

  const [availableWaypoints, setAvailableWaypoints] = useState<WaypointNode[]>([]);
  const [availableZones, setAvailableZones] = useState<Array<{ id: string; label: string; type: string }>>([]);
  const [activeRoute, setActiveRoute] = useState<PathResult | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [showDirectionsDrawer, setShowDirectionsDrawer] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [locatingGeo, setLocatingGeo] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  // Load available zones & graph nodes for selectors
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function loadMeta() {
      try {
        const zonesRes = await fetch("/api/admin/floorplan/zones");
        const zonesData = await safeJson(zonesRes, { success: false, zones: [] });
        if (isMounted && zonesData.success && Array.isArray(zonesData.zones)) {
          setAvailableZones(zonesData.zones);
        }

        const graphRes = await fetch("/api/admin/floorplan/graph");
        const graphData = await safeJson(graphRes, { success: false, graph: { nodes: [] } });
        if (isMounted && graphData.success && Array.isArray(graphData.graph?.nodes)) {
          setAvailableWaypoints(graphData.graph.nodes);
        }
      } catch (err) {
        console.warn("Could not load floorplan meta:", err);
      }
    }

    loadMeta();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 1. Fetch floor plan SVG
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    fetch(effectiveFloorPlanUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load floor plan (${res.status})`);
        }
        return res.text();
      })
      .then((svgText) => {
        if (!isMounted) return;
        if (!svgText.includes("<svg")) {
          throw new Error("Invalid floor plan SVG content.");
        }
        setSvgContent(svgText);
        setLoadedUrl(effectiveFloorPlanUrl);
        setLoadError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Floor plan load error:", err);
        setLoadError(err.message || "Failed to load floor plan SVG.");
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, effectiveFloorPlanUrl]);

  // 2. Center and highlight target room once SVG is rendered
  const focusZone = useCallback((zoneId: string, zoomLevel = 1.6) => {
    if (!svgWrapperRef.current || !containerRef.current) return;
    const targetEl = svgWrapperRef.current.querySelector(`#${zoneId}`) as SVGGraphicsElement | null;
    if (!targetEl || typeof targetEl.getBBox !== "function") return;

    try {
      const bbox = targetEl.getBBox();
      const containerRect = containerRef.current.getBoundingClientRect();

      // SVG center in local coords
      const targetCenterX = bbox.x + bbox.width / 2;
      const targetCenterY = bbox.y + bbox.height / 2;

      // Calculate pan to bring target to center of container
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;

      const newPanX = containerCenterX - targetCenterX * zoomLevel;
      const newPanY = containerCenterY - targetCenterY * zoomLevel;

      setScale(zoomLevel);
      setPan({ x: newPanX, y: newPanY });
    } catch (e) {
      console.warn("Could not compute room BBox:", e);
    }
  }, []);

  const resetView = useCallback(() => {
    if (containerRef.current && svgWrapperRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const svgEl = svgWrapperRef.current.querySelector("svg");
      const viewBox = svgEl?.viewBox?.baseVal;
      const svgWidth = viewBox?.width || 800;
      const svgHeight = viewBox?.height || 600;

      // Fit SVG nicely within container with padding
      const fitScale = Math.min(
        (containerRect.width * 0.9) / svgWidth,
        (containerRect.height * 0.9) / svgHeight,
        1.2
      );

      const finalScale = Math.max(fitScale, 0.7);
      const initialPanX = (containerRect.width - svgWidth * finalScale) / 2;
      const initialPanY = (containerRect.height - svgHeight * finalScale) / 2;

      setScale(finalScale);
      setPan({ x: initialPanX, y: initialPanY });
    } else {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, []);

  // 3. Post-render DOM manipulation: pulsing highlight, click, hover, amenities
  useEffect(() => {
    if (!svgContent || !svgWrapperRef.current) return;

    const wrapper = svgWrapperRef.current;
    const activeZone = selectedZoneId || highlightZoneId;

    // Reset previous highlights
    wrapper.querySelectorAll(".pulse-room").forEach((el) => {
      el.classList.remove("pulse-room");
    });

    if (activeZone) {
      const targetShape = wrapper.querySelector(`#${activeZone}`);
      if (targetShape) {
        targetShape.classList.add("pulse-room");
      }
    }

    // Interactive hover & clicks on all zone shapes
    const shapes = wrapper.querySelectorAll<SVGGraphicsElement>(
      "path[id], polygon[id], rect[id], circle[id]"
    );

    const handleMouseEnter = (e: Event) => {
      const el = e.currentTarget as SVGGraphicsElement;
      const id = el.id;
      if (!id || id.startsWith("wp-")) return;
      const label = id
        .replace(/^amenity-/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setHoveredZoneName(label);
    };

    const handleMouseLeave = () => {
      setHoveredZoneName(null);
    };

    const handleClick = (e: Event) => {
      const el = e.currentTarget as SVGGraphicsElement;
      const id = el.id;
      if (!id || id.startsWith("wp-")) return;
      setClickedZoneId(id);
      focusZone(id, 1.7);
    };

    shapes.forEach((s) => {
      if (s.id && !s.id.startsWith("wp-")) {
        s.style.cursor = "pointer";
        s.addEventListener("mouseenter", handleMouseEnter);
        s.addEventListener("mouseleave", handleMouseLeave);
        s.addEventListener("click", handleClick);
      }
    });

    // Initial centering if highlighted zone exists
    const timer = setTimeout(() => {
      if (activeZone) {
        focusZone(activeZone, 1.5);
      } else {
        resetView();
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      shapes.forEach((s) => {
        s.removeEventListener("mouseenter", handleMouseEnter);
        s.removeEventListener("mouseleave", handleMouseLeave);
        s.removeEventListener("click", handleClick);
      });
    };
  }, [svgContent, selectedZoneId, highlightZoneId, focusZone, resetView]);

  // 4. Filter Amenities in SVG
  useEffect(() => {
    if (!svgWrapperRef.current) return;
    const wrapper = svgWrapperRef.current;
    const amenitiesGroup = wrapper.querySelector("#amenities");
    if (!amenitiesGroup) return;

    if (!showAmenities) {
      amenitiesGroup.setAttribute("display", "none");
      return;
    }
    amenitiesGroup.setAttribute("display", "inline");

    // Sub-filtering
    const amenityElements = amenitiesGroup.querySelectorAll<SVGElement>("[id^='amenity-']");
    amenityElements.forEach((el) => {
      const id = el.id;
      let visible = true;
      if (amenityFilter === "RESTROOM" && !id.includes("restroom")) visible = false;
      if (amenityFilter === "WATER" && !id.includes("water")) visible = false;
      if (amenityFilter === "FOOD" && !id.includes("food")) visible = false;
      if (amenityFilter === "HELPDESK" && !id.includes("helpdesk")) visible = false;

      el.setAttribute("display", visible ? "inline" : "none");
    });
  }, [showAmenities, amenityFilter, svgContent]);

  // ==================== STEP 6: INJECT "YOU ARE HERE" BEACON & ROUTE POLYLINE ====================
  useEffect(() => {
    if (!svgWrapperRef.current) return;
    const svg = svgWrapperRef.current.querySelector("svg");
    if (!svg) return;

    // Clean up previous elements
    const oldRoute = svg.querySelector("#active-wayfinding-route");
    if (oldRoute) oldRoute.remove();

    const oldBeacon = svg.querySelector("#you-are-here-beacon");
    if (oldBeacon) oldBeacon.remove();

    // 1. Locate starting waypoint coordinates
    let startX = 100;
    let startY = 500;
    const startNodeEl = svg.querySelector(`#${userWaypointId}`) as SVGCircleElement | null;
    if (startNodeEl) {
      const cx = startNodeEl.getAttribute("cx") || startNodeEl.getAttribute("x");
      const cy = startNodeEl.getAttribute("cy") || startNodeEl.getAttribute("y");
      if (cx) startX = parseFloat(cx);
      if (cy) startY = parseFloat(cy);
    } else {
      // Find in availableWaypoints
      const wNode = availableWaypoints.find((w) => w.id === userWaypointId);
      if (wNode) {
        startX = wNode.x;
        startY = wNode.y;
      }
    }

    // Render "You Are Here" Beacon
    const beaconG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    beaconG.setAttribute("id", "you-are-here-beacon");
    beaconG.setAttribute("class", "shine-beacon-group");

    // Outer pulsing ring
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", String(startX));
    ring.setAttribute("cy", String(startY));
    ring.setAttribute("r", "16");
    ring.setAttribute("class", "shine-beacon-pulse-ring");
    beaconG.appendChild(ring);

    // Inner glowing dot
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", String(startX));
    dot.setAttribute("cy", String(startY));
    dot.setAttribute("r", "6");
    dot.setAttribute("fill", "#00E5FF");
    dot.setAttribute("stroke", "#ffffff");
    dot.setAttribute("stroke-width", "2");
    beaconG.appendChild(dot);

    // Badge background
    const badgeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    badgeRect.setAttribute("x", String(startX - 40));
    badgeRect.setAttribute("y", String(startY - 28));
    badgeRect.setAttribute("width", "80");
    badgeRect.setAttribute("height", "16");
    badgeRect.setAttribute("rx", "4");
    badgeRect.setAttribute("fill", "#0B0A0A");
    badgeRect.setAttribute("stroke", "#00E5FF");
    badgeRect.setAttribute("stroke-width", "1");
    beaconG.appendChild(badgeRect);

    // Badge text
    const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    badgeText.setAttribute("x", String(startX));
    badgeText.setAttribute("y", String(startY - 17));
    badgeText.setAttribute("text-anchor", "middle");
    badgeText.setAttribute("fill", "#00E5FF");
    badgeText.setAttribute("font-size", "8.5");
    badgeText.setAttribute("font-weight", "bold");
    badgeText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    badgeText.textContent = "YOU ARE HERE";
    beaconG.appendChild(badgeText);

    svg.appendChild(beaconG);

    // 2. Render Active Shortest-Path Route Polyline (if route active)
    if (activeRoute && activeRoute.found && activeRoute.nodes && activeRoute.nodes.length >= 2) {
      const routeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      routeG.setAttribute("id", "active-wayfinding-route");

      const pointsStr = activeRoute.nodes.map((n: WaypointNode) => `${n.x},${n.y}`).join(" ");

      // Underglow line
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      glow.setAttribute("points", pointsStr);
      glow.setAttribute("fill", "none");
      glow.setAttribute("stroke", "rgba(255, 107, 26, 0.45)");
      glow.setAttribute("stroke-width", "10");
      glow.setAttribute("stroke-linecap", "round");
      glow.setAttribute("stroke-linejoin", "round");
      routeG.appendChild(glow);

      // Animated glowing dash line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("points", pointsStr);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#FF6B1A");
      line.setAttribute("stroke-width", "4.5");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-linejoin", "round");
      line.setAttribute("stroke-dasharray", "8 5");
      line.setAttribute("class", "shine-animated-route-line");
      routeG.appendChild(line);

      // Intermediate Waypoint Nodes
      activeRoute.nodes.slice(1, -1).forEach((node: WaypointNode) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", String(node.x));
        c.setAttribute("cy", String(node.y));
        c.setAttribute("r", "3.5");
        c.setAttribute("fill", "#ffffff");
        c.setAttribute("stroke", "#FF6B1A");
        c.setAttribute("stroke-width", "1.5");
        routeG.appendChild(c);
      });

      // Target Pin Circle
      const lastNode = activeRoute.nodes[activeRoute.nodes.length - 1];
      const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pin.setAttribute("cx", String(lastNode.x));
      pin.setAttribute("cy", String(lastNode.y));
      pin.setAttribute("r", "7");
      pin.setAttribute("fill", "#FF6B1A");
      pin.setAttribute("stroke", "#ffffff");
      pin.setAttribute("stroke-width", "2");
      routeG.appendChild(pin);

      svg.appendChild(routeG);
    }
  }, [svgContent, userWaypointId, activeRoute, availableWaypoints]);

  // Compute A* route to target
  const handleComputeRoute = async (targetId?: string) => {
    const destination = targetId || selectedZoneId;
    if (!destination) return;

    setNavigating(true);
    try {
      const res = await fetch(`/api/wayfinding/route?from=${encodeURIComponent(userWaypointId)}&to=${encodeURIComponent(destination)}`);
      const data = await safeJson(res, { success: false, route: null });
      if (data.success && data.route && data.route.found) {
        setActiveRoute(data.route);
        setShowDirectionsDrawer(true);
      } else {
        setActiveRoute(null);
        alert(`No walkable indoor route found between ${userWaypointId} and ${destination}. Check waypoint connections in admin floor plan settings.`);
      }
    } catch (err: unknown) {
      console.error("Navigation error:", err);
    } finally {
      setNavigating(false);
    }
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setShowDirectionsDrawer(false);
  };

  // Opt-in Outdoor Geolocation (GPS approach)
  const handleOutdoorGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice("Browser Geolocation is not supported on this device.");
      return;
    }

    setLocatingGeo(true);
    setGeoNotice("Detecting GPS proximity to campus...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGeo(false);
        const { latitude, longitude } = pos.coords;

        // Sacred Heart College (Autonomous), Tirupattur: 12.5028° N, 78.5724° E
        const SHC_LAT = 12.5028;
        const SHC_LNG = 78.5724;

        // Haversine formula for distance in meters
        const R = 6371e3;
        const φ1 = (latitude * Math.PI) / 180;
        const φ2 = (SHC_LAT * Math.PI) / 180;
        const Δφ = ((SHC_LAT - latitude) * Math.PI) / 180;
        const Δλ = ((SHC_LNG - longitude) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distMeters = Math.round(R * c);

        if (distMeters < 800) {
          setSelectedWaypointId("wp-entrance");
          try {
            localStorage.setItem("shine_last_waypoint", "wp-entrance");
          } catch {}
          setGeoNotice(
            `Approaching Sacred Heart College campus (${distMeters}m away). Starting indoor navigation from Main Entrance Gate.`
          );
        } else {
          setGeoNotice(
            `You are ${(distMeters / 1000).toFixed(1)}km from Sacred Heart College. Starting default orientation at Main Entrance Gate.`
          );
        }
      },
      () => {
        setLocatingGeo(false);
        setGeoNotice("Location permission declined or unavailable. Defaulting to Main Entrance Gate.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 5. Mouse Wheel Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setScale((prev) => {
      const next = prev * zoomFactor;
      return Math.min(Math.max(next, 0.4), 4.5);
    });
  }, []);

  // 6. Pointer Pan Handlers (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 7. Pinch-to-zoom for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
      touchScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / touchDistanceRef.current;
      const nextScale = Math.min(Math.max(touchScaleRef.current * ratio, 0.4), 4.5);
      setScale(nextScale);
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  // 8. Accessibility: Keyboard Esc & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "+" || e.key === "=") {
        setScale((prev) => Math.min(prev * 1.2, 4.5));
      }
      if (e.key === "-" || e.key === "_") {
        setScale((prev) => Math.max(prev * 0.8, 0.4));
      }
      if (e.key === "0") {
        resetView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, resetView]);

  if (!isOpen) return null;

  const currentZoneDisplayName = selectedZoneId
    ? selectedZoneId
        .replace(/^amenity-/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="floorplan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Dynamic Keyframes for Room Pulse, You Are Here Beacon and Route Dash */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .pulse-room {
          animation: shine-room-pulse 2s infinite ease-in-out !important;
          cursor: pointer;
        }
        @keyframes shine-room-pulse {
          0%, 100% {
            fill: #FF6B1A !important;
            filter: drop-shadow(0 0 6px rgba(255, 107, 26, 0.7));
            stroke: #FFA266 !important;
            stroke-width: 3.5px !important;
          }
          50% {
            fill: #E8551F !important;
            filter: drop-shadow(0 0 20px rgba(255, 107, 26, 1));
            stroke: #FFE5D4 !important;
            stroke-width: 4.5px !important;
          }
        }
        @keyframes shine-beacon-pulse {
          0% {
            r: 7px;
            opacity: 1;
            stroke: #00E5FF;
            stroke-width: 3px;
            fill: rgba(0, 229, 255, 0.5);
          }
          100% {
            r: 30px;
            opacity: 0;
            stroke: #00E5FF;
            stroke-width: 1px;
            fill: rgba(0, 229, 255, 0);
          }
        }
        .shine-beacon-pulse-ring {
          animation: shine-beacon-pulse 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }
        @keyframes shine-route-dash {
          to {
            stroke-dashoffset: -26;
          }
        }
        .shine-animated-route-line {
          animation: shine-route-dash 1.2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-room,
          .shine-beacon-pulse-ring,
          .shine-animated-route-line {
            animation: none !important;
          }
        }
      `}} />

      <div
        ref={modalRef}
        className={`bg-[#0B0A0A] border border-stone-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100 transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 rounded-none w-screen h-screen z-50"
            : "w-full max-w-6xl h-[92vh] max-h-[880px]"
        }`}
      >
        {/* ==================== HEADER ==================== */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-stone-800/80 bg-[#121111]/90 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A] shrink-0">
              <Compass className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="floorplan-modal-title"
                  className="text-base sm:text-lg font-black tracking-tight text-white truncate"
                >
                  {title}
                </h2>
                {currentZoneDisplayName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF6B1A]/15 text-[#FF6B1A] border border-[#FF6B1A]/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A] animate-ping" />
                    <span>Target: {currentZoneDisplayName}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 truncate">
                {subtitle || "Interactive Blueprint • Sacred Heart College (Autonomous) Campus"}
              </p>
            </div>
          </div>

          {/* Action buttons (Navigate me, 2D/3D toggle, Fullscreen, Close) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Primary "Navigate Me" Button */}
            {selectedZoneId && (
              <button
                type="button"
                onClick={() => handleComputeRoute()}
                disabled={navigating}
                className="tap-target hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B1A] hover:bg-[#E8551F] text-white text-xs font-bold shadow-md shadow-[#FF6B1A]/20 transition"
              >
                <Route className={`w-3.5 h-3.5 ${navigating ? "animate-spin" : ""}`} />
                <span>{navigating ? "Routing..." : "Navigate Me"}</span>
              </button>
            )}

            {/* 2D / 3D Mode Selector */}
            <div className="hidden sm:flex items-center p-0.5 bg-stone-900 border border-stone-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("2D")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "2D"
                    ? "bg-[#FF6B1A] text-white shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                2D Map
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("3D")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === "3D"
                    ? "bg-[#FF6B1A] text-white shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="3D Simulation View"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>3D View</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="tap-target p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="tap-target p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
              aria-label="Close interactive floor plan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ==================== SUB-BAR: ORIGIN & QUICK DESTINATION SELECTOR ==================== */}
        <div className="px-4 sm:px-6 py-2 bg-[#171515] border-b border-stone-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Origin indicator with selector */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg text-stone-300">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="text-[11px] text-stone-400">Origin:</span>
              <select
                value={userWaypointId}
                onChange={(e) => {
                  setSelectedWaypointId(e.target.value);
                  try {
                    localStorage.setItem("shine_last_waypoint", e.target.value);
                  } catch {}
                  if (activeRoute) {
                    handleComputeRoute();
                  }
                }}
                className="bg-transparent font-bold text-white text-xs focus:outline-none cursor-pointer"
              >
                {availableWaypoints.length > 0 ? (
                  availableWaypoints.map((w) => (
                    <option key={w.id} value={w.id} className="bg-stone-900 text-stone-200">
                      {w.label || w.id}
                    </option>
                  ))
                ) : (
                  <option value="wp-entrance" className="bg-stone-900 text-stone-200">
                    Main Entrance Gate (wp-entrance)
                  </option>
                )}
              </select>
            </div>

            {/* Target Destination Selector */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg text-stone-300">
              <MapPin className="w-3 h-3 text-[#FF6B1A]" />
              <span className="text-[11px] text-stone-400">Target:</span>
              <select
                value={selectedZoneId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setClickedZoneId(val || null);
                  if (val) {
                    focusZone(val, 1.6);
                  } else {
                    handleClearRoute();
                  }
                }}
                className="bg-transparent font-bold text-white text-xs focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
              >
                <option value="" className="bg-stone-900 text-stone-400">Select Venue Destination...</option>
                {availableZones.map((z) => (
                  <option key={z.id} value={z.id} className="bg-stone-900 text-stone-200">
                    {z.label} ({z.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Navigate Button */}
            {selectedZoneId && (
              <button
                type="button"
                onClick={() => handleComputeRoute()}
                disabled={navigating}
                className="sm:hidden tap-target inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF6B1A] text-white text-xs font-bold"
              >
                <Route className="w-3 h-3" />
                <span>Navigate</span>
              </button>
            )}
          </div>

          {/* Right: GPS Outdoor Proximity & Privacy Guarantee */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOutdoorGeolocation}
              disabled={locatingGeo}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-white px-2 py-1 rounded-md bg-stone-900/60 hover:bg-stone-800 transition"
              title="Detect campus proximity using GPS"
            >
              <Locate className={`w-3 h-3 ${locatingGeo ? "animate-spin text-[#FF6B1A]" : ""}`} />
              <span>{locatingGeo ? "Locating..." : "Outdoor GPS"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
              className="text-[11px] text-stone-500 hover:text-stone-300 inline-flex items-center gap-1"
              title="Zero tracking privacy policy"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Privacy</span>
            </button>
          </div>
        </div>

        {/* Geolocation feedback banner */}
        {geoNotice && (
          <div className="px-4 py-1.5 bg-emerald-950/60 border-b border-emerald-900/50 text-[11px] text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{geoNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeoNotice(null)}
              className="text-emerald-400 hover:text-white ml-2 text-xs"
            >
              ×
            </button>
          </div>
        )}

        {/* Privacy notice banner */}
        {showPrivacyNotice && (
          <div className="px-4 py-2 bg-stone-900 border-b border-stone-800 text-[11px] text-stone-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Zero-Tracking Guarantee:</strong> Your position is computed locally in this browser. No personal location history is saved or shared to any server.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPrivacyNotice(false)}
              className="text-stone-400 hover:text-white ml-2 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==================== MAP VIEWPORT ==================== */}
        <div className="relative flex-1 bg-[#0B0A0A] overflow-hidden select-none">
          {/* Subtle blueprint grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-3 z-20">
              <div className="w-10 h-10 border-3 border-[#FF6B1A]/20 border-t-[#FF6B1A] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-stone-400">Loading campus blueprint...</p>
            </div>
          ) : loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-3">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Floor Plan Preview Unavailable</h3>
              <p className="text-xs text-stone-400 max-w-sm mb-4">
                The floor plan map is currently being updated or finalized by event coordinators.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="tap-target px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition-colors"
              >
                Close Map
              </button>
            </div>
          ) : activeTab === "3D" ? (
            <Venue3D
              svgContent={svgContent || ""}
              highlightZoneId={highlightZoneId}
              selectedZoneId={selectedZoneId}
              userWaypointId={userWaypointId}
              activeRoute={activeRoute}
              onSelectZone={(id) => {
                setClickedZoneId(id);
                focusZone(id);
              }}
              onFallback2D={() => setActiveTab("2D")}
            />
          ) : (
            <div
              ref={containerRef}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-hidden"
              style={{ touchAction: "none" }}
            >
              {/* Pan & Zoom Transform Canvas */}
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: "0 0",
                  transition: isDragging ? "none" : "transform 150ms ease-out",
                }}
                className="inline-block"
              >
                <div
                  ref={svgWrapperRef}
                  dangerouslySetInnerHTML={{ __html: svgContent || "" }}
                  className="select-none pointer-events-auto"
                />
              </div>
            </div>
          )}

          {/* ==================== FLOATING CONTROLS (TOP RIGHT) ==================== */}
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 bg-[#141212]/90 backdrop-blur-md border border-stone-800 p-1.5 rounded-2xl shadow-xl">
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(s * 1.25, 4.5))}
              className="tap-target p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/80 transition-colors"
              title="Zoom In (+)"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setScale((s) => Math.max(s * 0.8, 0.4))}
              className="tap-target p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/80 transition-colors"
              title="Zoom Out (-)"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={resetView}
              className="tap-target p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/80 transition-colors"
              title="Reset View (0)"
              aria-label="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {highlightZoneId && (
              <button
                type="button"
                onClick={() => focusZone(highlightZoneId, 1.8)}
                className="tap-target p-2 rounded-xl text-[#FF6B1A] hover:bg-[#FF6B1A]/10 transition-colors border border-[#FF6B1A]/20"
                title="Focus Assigned Room"
                aria-label="Focus assigned room"
              >
                <Target className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ==================== FLOATING ROOM INSPECTION BADGE (TOP LEFT) ==================== */}
          {(hoveredZoneName || currentZoneDisplayName) && (
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
              <div className="bg-[#141212]/90 backdrop-blur-md border border-stone-800 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    {hoveredZoneName ? "Inspecting Room" : "Target Venue Room"}
                  </span>
                  <span className="text-xs font-black text-white">
                    {hoveredZoneName || currentZoneDisplayName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TURN-BY-TURN NAVIGATION DRAWER (BOTTOM OVERLAY) ==================== */}
          {activeRoute && showDirectionsDrawer && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 bg-[#121111]/95 backdrop-blur-md border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
              <div className="px-4 py-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#FF6B1A]" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Turn-by-Turn Directions
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {activeRoute.totalDistance}m • ~{Math.max(1, Math.round(activeRoute.totalDistance / 60))} min walk
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClearRoute}
                    className="text-[11px] font-semibold text-stone-400 hover:text-white px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition"
                  >
                    Clear Route
                  </button>
                </div>
              </div>

              <div className="p-3.5 max-h-56 overflow-y-auto space-y-2.5 text-xs text-stone-300">
                {activeRoute.steps.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                      idx === 0
                        ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40"
                        : idx === activeRoute.steps.length - 1
                        ? "bg-[#FF6B1A]/20 text-[#FF6B1A] border border-[#FF6B1A]/40"
                        : "bg-stone-800 text-stone-400"
                    }`}>
                      {idx + 1}
                    </span>
                    <p className="leading-snug text-stone-200">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== MOBILE 2D/3D SWITCHER ==================== */}
          <div className="sm:hidden absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center p-0.5 bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-xl text-xs font-semibold shadow-lg">
              <button
                type="button"
                onClick={() => setActiveTab("2D")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "2D"
                    ? "bg-[#FF6B1A] text-white"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                2D Map
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("3D")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === "3D"
                    ? "bg-[#FF6B1A] text-white"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>3D View</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================== BOTTOM LEGEND & AMENITIES TOOLBAR ==================== */}
        <footer className="px-4 sm:px-6 py-3 border-t border-stone-800/80 bg-[#121111]/95 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Amenities Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Amenities:</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setShowAmenities(true);
                setAmenityFilter("ALL");
              }}
              className={`tap-target px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                showAmenities && amenityFilter === "ALL"
                  ? "bg-stone-700 text-white border border-stone-600"
                  : "bg-stone-900 text-stone-400 hover:text-white border border-stone-800"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAmenities(true);
                setAmenityFilter("RESTROOM");
              }}
              className={`tap-target px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                showAmenities && amenityFilter === "RESTROOM"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                  : "bg-stone-900 text-stone-400 hover:text-white border border-stone-800"
              }`}
            >
              <span>🚻</span>
              <span>Restrooms</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAmenities(true);
                setAmenityFilter("WATER");
              }}
              className={`tap-target px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                showAmenities && amenityFilter === "WATER"
                  ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                  : "bg-stone-900 text-stone-400 hover:text-white border border-stone-800"
              }`}
            >
              <Droplets className="w-3 h-3 text-cyan-400" />
              <span>Water</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAmenities(true);
                setAmenityFilter("FOOD");
              }}
              className={`tap-target px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                showAmenities && amenityFilter === "FOOD"
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/50"
                  : "bg-stone-900 text-stone-400 hover:text-white border border-stone-800"
              }`}
            >
              <Utensils className="w-3 h-3 text-amber-400" />
              <span>Dining</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAmenities(true);
                setAmenityFilter("HELPDESK");
              }}
              className={`tap-target px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                showAmenities && amenityFilter === "HELPDESK"
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                  : "bg-stone-900 text-stone-400 hover:text-white border border-stone-800"
              }`}
            >
              <HelpCircle className="w-3 h-3 text-purple-400" />
              <span>Help Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAmenities(!showAmenities)}
              className="text-[11px] text-stone-500 hover:text-stone-300 ml-1 underline cursor-pointer"
            >
              {showAmenities ? "Hide All" : "Show All"}
            </button>
          </div>

          {/* Legend Guide */}
          <div className="flex items-center gap-4 text-[11px] text-stone-400 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="text-cyan-300 font-bold">You Are Here</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B1A] animate-pulse" />
              <span className="text-stone-300 font-bold">Assigned Venue</span>
            </div>
            <div className="text-[10px] text-stone-500 font-mono hidden md:inline-block">
              {Math.round(scale * 100)}% Zoom
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
