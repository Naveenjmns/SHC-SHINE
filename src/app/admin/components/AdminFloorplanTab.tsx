"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Upload,
  RefreshCw,
  Layers,
  Route,
  QrCode,
  ShieldCheck,
  Check,
  X,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { WaypointNode, WaypointEdge, GraphValidationResult } from "@/lib/wayfinding";
import { validateWaypointGraph } from "@/lib/wayfinding";

interface AdminFloorplanTabProps {
  floorPlanUrl: string;
  onChangeFloorPlanUrl: (url: string) => void;
  onUploadSvg: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploading: boolean;
  detectedZones: any[];
  loadingZones: boolean;
  onScanZones: () => void;
  graphData: { nodes: WaypointNode[]; edges: WaypointEdge[] };
  setGraphData: React.Dispatch<React.SetStateAction<{ nodes: WaypointNode[]; edges: WaypointEdge[] }>>;
  onSaveGraph: () => Promise<void>;
  savingGraph: boolean;
  onOpenPrintableQr: () => void;
  onOpenInteractiveModal: () => void;
}

export default function AdminFloorplanTab({
  floorPlanUrl,
  onChangeFloorPlanUrl,
  onUploadSvg,
  uploading,
  detectedZones,
  loadingZones,
  onScanZones,
  graphData,
  setGraphData,
  onSaveGraph,
  savingGraph,
  onOpenPrintableQr,
  onOpenInteractiveModal,
}: AdminFloorplanTabProps) {
  const [selectedWaypointA, setSelectedWaypointA] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<GraphValidationResult | null>(null);

  const handleWaypointClick = (nodeId: string) => {
    if (!selectedWaypointA) {
      setSelectedWaypointA(nodeId);
      return;
    }

    if (selectedWaypointA === nodeId) {
      setSelectedWaypointA(null);
      return;
    }

    // Toggle edge between node A and node B
    const existingIndex = graphData.edges.findIndex(
      (e) =>
        (e.a === selectedWaypointA && e.b === nodeId) ||
        (e.a === nodeId && e.b === selectedWaypointA)
    );

    if (existingIndex >= 0) {
      // Remove edge
      setGraphData((prev) => ({
        ...prev,
        edges: prev.edges.filter((_, idx) => idx !== existingIndex),
      }));
    } else {
      // Calculate approximate Euclidean distance
      const nodeA = graphData.nodes.find((n) => n.id === selectedWaypointA);
      const nodeB = graphData.nodes.find((n) => n.id === nodeId);
      const dist =
        nodeA && nodeB
          ? Math.max(1, Math.round(Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y) * 0.1))
          : 5;

      setGraphData((prev) => ({
        ...prev,
        edges: [...prev.edges, { a: selectedWaypointA, b: nodeId, weight: dist }],
      }));
    }

    setSelectedWaypointA(null);
  };

  const handleRemoveEdge = (idx: number) => {
    setGraphData((prev) => ({
      ...prev,
      edges: prev.edges.filter((_, i) => i !== idx),
    }));
  };

  const handleValidate = () => {
    const report = validateWaypointGraph(graphData, detectedZones || []);
    setValidationReport(report);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            <span>Campus Floor Plan &amp; Wayfinding Graph</span>
          </h2>
          <p className="text-xs text-ink-muted">
            Upload SVG venue maps and configure A* navigation waypoints for delegates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onOpenInteractiveModal} className="text-xs">
            <Maximize2 className="w-3.5 h-3.5 mr-1" />
            2D/3D Map View
          </Button>

          <Button variant="secondary" size="sm" onClick={onOpenPrintableQr} className="text-xs">
            <QrCode className="w-3.5 h-3.5 mr-1 text-accent" />
            Print Checkpoints
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Floor plan config and zone details */}
        <div className="lg:col-span-2 space-y-5">
          {/* File Upload & URL */}
          <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Upload className="w-4 h-4 text-accent" />
                <span>Venue SVG Vector Blueprint</span>
              </h3>
              <span className="text-[10px] tabular-nums text-ink-muted">
                Max 2MB (SVG)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-[8px] text-xs font-semibold hover:bg-surface-raised transition bg-surface">
                <Upload className="w-3.5 h-3.5 text-accent" />
                <span>{uploading ? "Sanitizing..." : "Upload Blueprint (.svg)"}</span>
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  disabled={uploading}
                  onChange={onUploadSvg}
                />
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={onScanZones}
                loading={loadingZones}
                className="text-xs h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1 text-accent" />
                Re-scan Zones
              </Button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Active SVG Blueprint Path
              </label>
              <Input
                value={floorPlanUrl}
                onChange={(e) => onChangeFloorPlanUrl(e.target.value)}
                placeholder="/uploads/campus-floorplan.svg"
                className="text-xs font-mono h-8"
              />
            </div>

            {/* Detected Zones List */}
            <div className="p-3 bg-surface-raised border border-border rounded-[8px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  <span>Interactive Campus Zones</span>
                </span>
                <span className="text-[11px] text-ink-muted">
                  {detectedZones.length} detected
                </span>
              </div>

              {detectedZones.length === 0 ? (
                <p className="text-xs text-ink-muted italic">
                  No zones detected yet. Ensure your SVG shapes have unique IDs (e.g. id="hall-1").
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {detectedZones.map((z) => (
                    <span
                      key={z.id}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface border border-border text-ink"
                    >
                      {z.label} <code className="text-[10px] text-ink-muted">({z.id})</code>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Waypoint Routing Network */}
          <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Route className="w-4 h-4 text-accent" />
                  <span>A* Walking Network ({graphData.nodes.length} nodes, {graphData.edges.length} edges)</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  className="text-xs h-7"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-success" />
                  Validate
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSaveGraph}
                  loading={savingGraph}
                  className="text-xs h-7"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save Graph
                </Button>
              </div>
            </div>

            {/* Instruction strip */}
            <div className="p-2.5 rounded-[8px] bg-surface-raised border border-border text-xs text-ink-muted flex items-center justify-between">
              <span>
                {selectedWaypointA
                  ? `Selected ${selectedWaypointA}. Click a second node below to connect or disconnect corridor.`
                  : "Click any waypoint below to select it, then click a second waypoint to link corridor."}
              </span>
              {selectedWaypointA && (
                <button
                  type="button"
                  onClick={() => setSelectedWaypointA(null)}
                  className="text-xs text-accent font-semibold hover:underline ml-2"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Node Pills */}
            <div className="space-y-1.5">
              <span className="eyebrow text-[11px]">
                Waypoint Checkpoints
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {graphData.nodes.map((node) => {
                  const isSelected = selectedWaypointA === node.id;
                  const degree = graphData.edges.filter(
                    (e) => e.a === node.id || e.b === node.id
                  ).length;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => handleWaypointClick(node.id)}
                      className={`px-2 py-1 rounded-full text-xs font-mono transition-colors border cursor-pointer ${
                        isSelected
                          ? "bg-accent text-accent-ink border-accent font-semibold"
                          : degree === 0
                          ? "bg-danger-surface text-danger-ink border-danger-border"
                          : "bg-surface text-ink border-border hover:border-accent"
                      }`}
                    >
                      {node.id} ({degree})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Edges list */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <span className="eyebrow text-[11px]">
                Corridors ({graphData.edges.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {graphData.edges.map((edge, idx) => (
                  <span
                    key={`${edge.a}-${edge.b}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-surface-raised border border-border text-ink"
                  >
                    <span>{edge.a} ↔ {edge.b}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEdge(idx)}
                      className="text-ink-muted hover:text-danger"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Validation feedback */}
            {validationReport && (
              <div
                className={`p-3 rounded-[8px] border text-xs ${
                  validationReport.isValid
                    ? "bg-success-surface border-success-border text-success-ink"
                    : "bg-warning-surface border-warning-border text-warning-ink"
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {validationReport.isValid ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-warning" />
                  )}
                  <span>
                    {validationReport.isValid
                      ? "Graph Validated: 100% reachable walking paths."
                      : "Warning: Some waypoints are isolated or disconnected."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Tips & Live Blueprint Preview */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-ink">
              Wayfinding Quick Tips
            </h3>
            <ul className="text-xs text-ink-muted space-y-2 list-disc list-inside">
              <li>Each hall or stage must have an associated waypoint node.</li>
              <li>A* search computes shortest walking distance along defined corridor edges.</li>
              <li>Print QR checkpoint codes to post on physical doors and pillars.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
