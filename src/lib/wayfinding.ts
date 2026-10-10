/**
 * SHINE 26 Wayfinding & Shortest-Path Navigation Engine
 * Implements A* algorithm on indoor waypoint graphs, SVG waypoint parsing,
 * Euclidean distance metrics, turn-by-turn generation, and reachability validation.
 */

export interface WaypointNode {
  id: string; // Unique waypoint identifier, e.g. "wp-entrance", "wp-hall-1"
  x: number;
  y: number;
  floor: number;
  label?: string;
  zoneId?: string; // Associated venue room zone ID if this waypoint is an entrance/doorway
}

export interface WaypointEdge {
  a: string; // Node ID A
  b: string; // Node ID B
  weight?: number; // Distance weight (Euclidean or vertical penalty)
  isStairOrLift?: boolean;
}

export interface WaypointGraph {
  nodes: WaypointNode[];
  edges: WaypointEdge[];
}

export interface PathResult {
  found: boolean;
  totalDistance: number;
  pathNodeIds: string[];
  nodes: WaypointNode[];
  steps: string[]; // Human-readable turn-by-turn routing steps
}

export type ShortestPathResult = PathResult;

export interface GraphValidationResult {
  isValid: boolean;
  unreachableRooms: string[];
  disconnectedWaypoints: string[];
  totalNodes: number;
  totalEdges: number;
  totalRooms: number;
}

/**
 * Calculates Euclidean distance between two nodes, with an optional vertical floor penalty.
 */
export function calculateEuclideanDistance(
  n1: WaypointNode,
  n2: WaypointNode,
  floorTransitionPenalty = 250
): number {
  const dx = n1.x - n2.x;
  const dy = n1.y - n2.y;
  const horizontalDist = Math.hypot(dx, dy);
  const floorDiff = Math.abs(n1.floor - n2.floor);
  return Number((horizontalDist + floorDiff * floorTransitionPenalty).toFixed(2));
}

/**
 * Derives a clean human-readable label from a waypoint id.
 * e.g. "wp-hall-1" -> "Hall 1 Entrance", "wp-central-hub" -> "Central Hub"
 */
export function formatWaypointLabel(id: string): string {
  const cleaned = id.replace(/^wp-/, "");
  if (cleaned === "entrance") return "Main Entrance Gate";
  if (cleaned.startsWith("hall-")) {
    const num = cleaned.replace("hall-", "");
    return `Hall ${num} Entrance`;
  }
  return cleaned
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extracts waypoint nodes from an SVG string (circles with id="wp-*").
 * Works in both Node.js (SSR/API) and browser environments.
 */
export function parseWaypointsFromSvg(svgContent: string, defaultFloor = 1): WaypointNode[] {
  const nodes: WaypointNode[] = [];
  if (!svgContent) return nodes;

  // Regex to extract <circle ... id="wp-*" ...> with cx, cy, and optional data-floor
  const circleRegex = /<circle\b([^>]*?)>/gi;
  let match: RegExpExecArray | null;

  while ((match = circleRegex.exec(svgContent)) !== null) {
    const attrsStr = match[1];

    const idMatch = attrsStr.match(/\bid=["'](wp-[^"']+)["']/i);
    if (!idMatch) continue;

    const id = idMatch[1];
    const cxMatch = attrsStr.match(/\bcx=["']([0-9.]+)["']/i);
    const cyMatch = attrsStr.match(/\bcy=["']([0-9.]+)["']/i);
    const floorMatch = attrsStr.match(/\bdata-floor=["']([0-9]+)["']/i);

    const x = cxMatch ? parseFloat(cxMatch[1]) : 0;
    const y = cyMatch ? parseFloat(cyMatch[1]) : 0;
    const floor = floorMatch ? parseInt(floorMatch[1], 10) : defaultFloor;

    // Detect if this waypoint is linked to a room zone (e.g. wp-hall-1 -> hall-1, wp-food-area -> food-area)
    let zoneId: string | undefined = undefined;
    const stripped = id.replace(/^wp-/, "");
    if (stripped.startsWith("hall-") || stripped === "food-area" || stripped === "sponsor-booths") {
      zoneId = stripped;
    }

    nodes.push({
      id,
      x,
      y,
      floor,
      label: formatWaypointLabel(id),
      zoneId,
    });
  }

  return nodes;
}

/**
 * Default corridor connectivity for the SHINE campus blueprint.
 */
export const DEFAULT_CAMPUS_EDGES: WaypointEdge[] = [
  // Entrance to Central Hub
  { a: "wp-entrance", b: "wp-central-hub" },

  // Central Hub connections
  { a: "wp-central-hub", b: "wp-hall-1" },
  { a: "wp-central-hub", b: "wp-hall-4" },
  { a: "wp-central-hub", b: "wp-west-junction" },
  { a: "wp-central-hub", b: "wp-east-hub" },
  { a: "wp-central-hub", b: "wp-stairs-west" },

  // West wing connections
  { a: "wp-west-junction", b: "wp-food-area" },
  { a: "wp-west-junction", b: "wp-north-hallway" },
  { a: "wp-west-junction", b: "wp-stairs-west" },

  // East wing connections
  { a: "wp-east-hub", b: "wp-sponsor-booths" },
  { a: "wp-east-hub", b: "wp-hall-5" },
  { a: "wp-east-hub", b: "wp-hall-2" },
  { a: "wp-east-hub", b: "wp-stairs-east" },

  // East end connections
  { a: "wp-hall-2", b: "wp-hall-3" },
  { a: "wp-hall-3", b: "wp-hall-6" },
  { a: "wp-sponsor-booths", b: "wp-hall-6" },
];

/**
 * Builds or normalizes a WaypointGraph with computed edge weights.
 */
export function buildWaypointGraph(
  nodes: WaypointNode[],
  customEdges?: WaypointEdge[]
): WaypointGraph {
  const nodeMap = new Map<string, WaypointNode>(nodes.map((n) => [n.id, n]));
  const edgesToProcess = customEdges && customEdges.length > 0 ? customEdges : DEFAULT_CAMPUS_EDGES;

  const validEdges: WaypointEdge[] = [];
  const edgeKeys = new Set<string>();

  for (const edge of edgesToProcess) {
    const nodeA = nodeMap.get(edge.a);
    const nodeB = nodeMap.get(edge.b);
    if (!nodeA || !nodeB) continue;

    // Avoid duplicate bidirectional edges
    const key = [edge.a, edge.b].sort().join("<->");
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);

    const weight =
      edge.weight !== undefined
        ? edge.weight
        : calculateEuclideanDistance(nodeA, nodeB, edge.isStairOrLift ? 300 : 250);

    validEdges.push({
      a: edge.a,
      b: edge.b,
      weight,
      isStairOrLift: edge.isStairOrLift || nodeA.floor !== nodeB.floor,
    });
  }

  return { nodes, edges: validEdges };
}

/**
 * Computes the relative turn direction between two consecutive vectors.
 */
function getTurnDirection(
  prev: WaypointNode,
  curr: WaypointNode,
  next: WaypointNode
): "straight" | "slight left" | "sharp left" | "slight right" | "sharp right" {
  // Vector v1: prev -> curr
  const v1x = curr.x - prev.x;
  const v1y = curr.y - prev.y;

  // Vector v2: curr -> next
  const v2x = next.x - curr.x;
  const v2y = next.y - curr.y;

  // 2D Cross product (determines turn left or right)
  const cross = v1x * v2y - v1y * v2x;
  // Dot product (determines turn angle)
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);

  if (mag1 === 0 || mag2 === 0) return "straight";
  const cosAngle = dot / (mag1 * mag2);

  // If nearly straight (angle < ~25 deg)
  if (cosAngle > 0.9) return "straight";

  if (cross > 0) {
    return cosAngle < 0 ? "sharp right" : "slight right";
  } else {
    return cosAngle < 0 ? "sharp left" : "slight left";
  }
}

/**
 * A* Shortest Path Navigation Algorithm
 * Finds the optimal route between fromId and toTarget, returning total distance,
 * ordered nodes, and natural turn-by-turn instructions.
 */
export function shortestPath(
  graph: WaypointGraph,
  fromId: string,
  toTarget: string
): PathResult {
  const emptyResult: PathResult = {
    found: false,
    totalDistance: 0,
    pathNodeIds: [],
    nodes: [],
    steps: [],
  };

  if (!graph || !graph.nodes || graph.nodes.length === 0) return emptyResult;

  const nodeMap = new Map<string, WaypointNode>(graph.nodes.map((n) => [n.id, n]));

  // 1. Resolve start node
  let startNode = nodeMap.get(fromId);
  if (!startNode) {
    // Check if fromId was a room zone ID
    startNode = graph.nodes.find((n) => n.zoneId === fromId || n.id === `wp-${fromId}`);
  }
  if (!startNode) {
    // Default fallback to entrance
    startNode = nodeMap.get("wp-entrance") || graph.nodes[0];
  }

  // 2. Resolve destination node
  let goalNode = nodeMap.get(toTarget);
  if (!goalNode) {
    // Check if toTarget was a room zone ID
    goalNode = graph.nodes.find((n) => n.zoneId === toTarget || n.id === `wp-${toTarget}`);
  }
  if (!goalNode) {
    // Attempt approximate match
    const stripped = toTarget.toLowerCase().replace(/^wp-/, "").replace(/[^a-z0-9]/g, "");
    goalNode = graph.nodes.find((n) =>
      n.id.toLowerCase().replace(/^wp-/, "").replace(/[^a-z0-9]/g, "") === stripped
    );
  }

  if (!startNode || !goalNode) {
    return emptyResult;
  }

  // Trivial same-location case
  if (startNode.id === goalNode.id) {
    return {
      found: true,
      totalDistance: 0,
      pathNodeIds: [startNode.id],
      nodes: [startNode],
      steps: [`You have arrived at ${startNode.label || startNode.id}.`],
    };
  }

  // 3. Build Adjacency List
  const adj = new Map<string, Array<{ neighborId: string; weight: number; isStair: boolean }>>();
  for (const n of graph.nodes) {
    adj.set(n.id, []);
  }

  for (const edge of graph.edges) {
    const listA = adj.get(edge.a);
    const listB = adj.get(edge.b);
    const weight = edge.weight || 10;
    const isStair = !!edge.isStairOrLift;

    if (listA) listA.push({ neighborId: edge.b, weight, isStair });
    if (listB) listB.push({ neighborId: edge.a, weight, isStair });
  }

  // 4. A* Search
  const openSet = new Set<string>([startNode.id]);
  const cameFrom = new Map<string, string>();

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  for (const n of graph.nodes) {
    gScore.set(n.id, Infinity);
    fScore.set(n.id, Infinity);
  }

  gScore.set(startNode.id, 0);
  fScore.set(startNode.id, calculateEuclideanDistance(startNode, goalNode));

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let currentId: string | null = null;
    let lowestF = Infinity;

    for (const nodeId of openSet) {
      const f = fScore.get(nodeId) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = nodeId;
      }
    }

    if (!currentId) break;

    // Target reached!
    if (currentId === goalNode.id) {
      // Reconstruct path
      const pathNodeIds: string[] = [currentId];
      let curr = currentId;
      while (cameFrom.has(curr)) {
        curr = cameFrom.get(curr)!;
        pathNodeIds.unshift(curr);
      }

      const pathNodes = pathNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
      const totalDist = Number(gScore.get(goalNode.id)?.toFixed(1) || 0);

      // Generate turn-by-turn text steps
      const steps: string[] = [];
      steps.push(`Start at ${startNode.label || startNode.id}`);

      for (let i = 0; i < pathNodes.length - 1; i++) {
        const currNode = pathNodes[i];
        const nextNode = pathNodes[i + 1];

        // Check for floor transition
        if (currNode.floor !== nextNode.floor) {
          steps.push(
            `Take stairs/elevator from Floor ${currNode.floor} to Floor ${nextNode.floor}`
          );
          continue;
        }

        // Check turn direction if there is a previous vector
        if (i > 0) {
          const prevNode = pathNodes[i - 1];
          const turn = getTurnDirection(prevNode, currNode, nextNode);
          if (turn !== "straight") {
            steps.push(`Turn ${turn} towards ${nextNode.label || nextNode.id}`);
            continue;
          }
        }

        // Standard hallway traversal
        if (i === 0 || i === pathNodes.length - 2) {
          steps.push(`Follow hallway towards ${nextNode.label || nextNode.id}`);
        }
      }

      steps.push(`Arrive at ${goalNode.label || goalNode.id}`);

      return {
        found: true,
        totalDistance: totalDist,
        pathNodeIds,
        nodes: pathNodes,
        steps,
      };
    }

    openSet.delete(currentId);
    const neighbors = adj.get(currentId) || [];

    for (const { neighborId, weight } of neighbors) {
      const tentativeG = (gScore.get(currentId) ?? Infinity) + weight;

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);

        const neighborNode = nodeMap.get(neighborId);
        const h = neighborNode ? calculateEuclideanDistance(neighborNode, goalNode) : 0;
        fScore.set(neighborId, tentativeG + h);

        openSet.add(neighborId);
      }
    }
  }

  // No path exists
  return emptyResult;
}

/**
 * Validates the wayfinding graph for reachability.
 * Ensures all competition rooms have entrance waypoints that can be reached from the main entrance.
 */
export function validateGraph(
  graph: WaypointGraph,
  zones: Array<{ id: string; label?: string }>
): GraphValidationResult {
  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return {
      isValid: false,
      unreachableRooms: zones.map((z) => z.label || z.id),
      disconnectedWaypoints: [],
      totalNodes: 0,
      totalEdges: 0,
      totalRooms: zones.length,
    };
  }

  // 1. Find root entrance node (wp-entrance or first node)
  const rootNode = graph.nodes.find((n) => n.id === "wp-entrance") || graph.nodes[0];

  // 2. Build adjacency graph for reachability
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) {
    adj.set(n.id, []);
  }

  for (const edge of graph.edges) {
    const listA = adj.get(edge.a);
    const listB = adj.get(edge.b);
    if (listA) listA.push(edge.b);
    if (listB) listB.push(edge.a);
  }

  // 3. Breadth-First Search (BFS) from root
  const visited = new Set<string>();
  const queue: string[] = [rootNode.id];
  visited.add(rootNode.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // 4. Identify disconnected waypoints
  const disconnectedWaypoints: string[] = [];
  for (const n of graph.nodes) {
    if (!visited.has(n.id)) {
      disconnectedWaypoints.push(n.label ? `${n.label} (${n.id})` : n.id);
    }
  }

  // 5. Identify unreachable rooms
  const unreachableRooms: string[] = [];
  for (const zone of zones) {
    // Look for matching entrance waypoint
    const matchingNode = graph.nodes.find(
      (n) => n.zoneId === zone.id || n.id === `wp-${zone.id}` || n.id.includes(zone.id)
    );

    if (!matchingNode || !visited.has(matchingNode.id)) {
      unreachableRooms.push(zone.label || zone.id);
    }
  }

  const isValid = unreachableRooms.length === 0 && disconnectedWaypoints.length === 0;

  return {
    isValid,
    unreachableRooms,
    disconnectedWaypoints,
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    totalRooms: zones.length,
  };
}
