# SHINE Indoor Venue Floor Plan & Wayfinding Guide

This document defines the SVG drawing conventions, naming hierarchy, wayfinding graph structure, and coordinate guidelines for the interactive indoor mapping and shortest-path navigation system of the SHINE 26 event management platform.

---

## 1. SVG Architecture & Layer Structure

Every indoor floor plan uploaded to SHINE must be a valid, sanitized SVG file adhering to the following layer structure:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" width="100%" height="100%">
  <defs>
    <!-- Background grid patterns, gradients, and glow filters -->
  </defs>

  <!-- Layer 1: Campus Blueprint Background & Walls -->
  <rect width="100%" height="100%" fill="#0B0A0A" />

  <!-- Layer 2: Rooms & Competition Arenas -->
  <!-- Every room MUST be a closed filled shape (path, polygon, rect) with its ID ON the shape -->
  <g id="rooms">
    <path id="hall-1" d="..." fill="#141923" stroke="#22d3ee" stroke-width="2" />
    <polygon id="hall-2" points="..." fill="#141923" stroke="#38bdf8" />
    <rect id="hall-3" x="690" y="510" width="130" height="90" rx="10" />
    <polygon id="food-area" points="..." />
  </g>

  <!-- Layer 3: Room Labels (Visual text overlays) -->
  <g id="labels" pointer-events="none">
    <text x="420" y="320" fill="#ffffff" font-size="14" font-weight="bold">Hall 1</text>
  </g>

  <!-- Layer 4: Amenities Layer (<g id="amenities">) -->
  <g id="amenities">
    <g id="amenity-restroom-1">...</g>
    <g id="amenity-water-1">...</g>
    <g id="amenity-food-1">...</g>
    <g id="amenity-helpdesk-1">...</g>
  </g>

  <!-- Layer 5: Waypoints Layer (<g id="waypoints">) -->
  <!-- Navigation graph nodes for doors, junctions, stairs, and checkpoints -->
  <g id="waypoints" opacity="0.9">
    <circle id="wp-entrance" cx="410" cy="635" r="5" fill="#f43f5e" />
    <circle id="wp-central-hub" cx="420" cy="500" r="5" fill="#38bdf8" />
    <circle id="wp-hall-1" cx="425" cy="460" r="5" fill="#34d399" />
    <circle id="wp-stairs-west" cx="330" cy="520" r="5" fill="#c084fc" data-floor="1" />
  </g>
</svg>
```

---

## 2. Element ID Conventions

### A. Rooms & Venue Zones (Competition Arenas)
- Must be a closed shape (`<path>`, `<polygon>`, `<rect>`).
- The `id` attribute is placed directly on the shape element.
- Do NOT prefix competition rooms with `wp-` or `amenity-`.
- Valid examples:
  - `hall-1` (Main Auditorium Stage)
  - `hall-2` (Octagon Coding Arena)
  - `hall-3` (PG Computer Lab 1)
  - `food-area` (Central Food Court)
  - `sponsor-booths` (Expo & Career Stalls)
  - `registration-entrance` (Main Delegate Lobby)

### B. Amenities Layer (`<g id="amenities">`)
- Grouped inside `<g id="amenities">`.
- Uses standardized prefix format:
  - Restrooms: `amenity-restroom-1`, `amenity-restroom-2`, ...
  - Drinking Water: `amenity-water-1`, `amenity-water-2`, ...
  - Food & Refreshments: `amenity-food-1`, `amenity-food-2`, ...
  - Help Desk & Security: `amenity-helpdesk-1`, `amenity-helpdesk-2`, ...
- The 2D map interactive legend automatically recognizes these IDs for dynamic category filtering.

### C. Navigation Waypoints (`<g id="waypoints">`)
- Grouped inside `<g id="waypoints">`.
- Drawn as SVG `<circle>` elements with coordinates `cx`, `cy`, and `r="5"`.
- Must begin with `wp-`.
- Types of waypoints:
  1. **Entrance / Checkpoint**: `wp-entrance`
  2. **Hall / Room Doors**: `wp-<zoneId>` (e.g. `wp-hall-1` corresponds to door entrance of `hall-1`). This allows the A* engine to automatically route from any checkpoint directly to the room door.
  3. **Corridor Junctions**: `wp-central-hub`, `wp-west-junction`, `wp-east-hub`
  4. **Vertical Transit (Stairs / Elevators)**: `wp-stairs-west`, `wp-stairs-east`, `wp-lift-main`
     - Include optional `data-floor="1"` attribute (defaults to 1 if omitted).

---

## 3. Wayfinding Graph Data Model (`waypointGraph`)

Stored inside the PostgreSQL `event_editions` table as a JSON object:

```json
{
  "nodes": [
    { "id": "wp-entrance", "x": 410, "y": 635, "floor": 1, "label": "Main Entrance Gate" },
    { "id": "wp-central-hub", "x": 420, "y": 500, "floor": 1, "label": "Central Quadrangle Hub" },
    { "id": "wp-hall-1", "x": 425, "y": 460, "floor": 1, "label": "Hall 1 Entrance", "zoneId": "hall-1" },
    { "id": "wp-stairs-west", "x": 330, "y": 520, "floor": 1, "label": "West Staircase (Ground Floor)" },
    { "id": "wp-stairs-west-f2", "x": 330, "y": 520, "floor": 2, "label": "West Staircase (Floor 2)" }
  ],
  "edges": [
    { "a": "wp-entrance", "b": "wp-central-hub", "weight": 135.37 },
    { "a": "wp-central-hub", "b": "wp-hall-1", "weight": 40.31 },
    { "a": "wp-stairs-west", "b": "wp-stairs-west-f2", "weight": 250.0, "isStairOrLift": true }
  ]
}
```

### Edge Weights
- **Horizontal (same floor)**: Calculated as Euclidean distance:
  $$\text{weight} = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
- **Vertical (stairs / lift between floors)**: Configured with a floor transition penalty (default `250.0` units) to prioritize same-floor routing unless changing floors is strictly necessary.

---

## 4. Shortest-Path Navigation Engine (A*)

The wayfinding engine in `src/lib/wayfinding.ts` provides:

```typescript
shortestPath(
  graph: WaypointGraph,
  fromWaypointId: string, // e.g. "wp-entrance" or scanned QR checkpoint
  toTarget: string        // zoneId ("hall-1") or waypointId ("wp-hall-1")
): PathResult
```

### Algorithm Highlights:
1. **Target Resolution**: If `toTarget` is a room `zoneId`, the engine automatically maps it to the closest entrance waypoint (e.g. `wp-hall-1` or node with `zoneId === "hall-1"`).
2. **Heuristic $h(n)$**: Admissible Euclidean distance to target in 2D/3D space ensures the A* search is optimal.
3. **Turn-by-Turn Steps**: The algorithm computes heading vectors and generates natural human instructions:
   - *"Start at Main Entrance Gate"*
   - *"Walk straight along the central corridor towards Central Quadrangle Hub"*
   - *"Take West Staircase up to Floor 2"*
   - *"Turn left and arrive at Hall 1 Main Auditorium"*

---

## 5. Security & Sanitization

When an SVG is uploaded by an administrator at `POST /api/admin/upload`:
1. All `<script>` and `<iframe>` elements are removed.
2. All `on*` event handlers (`onclick`, `onload`, `onerror`, etc.) are stripped.
3. `<foreignObject>` containers are eliminated.
4. External URL references (`href="http://..."`, CSS `url(...)`) are sanitized to prevent SSRF and external asset tracking.
5. Max file size: 2 MB.

