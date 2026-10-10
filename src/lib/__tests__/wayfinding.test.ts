import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseWaypointsFromSvg,
  calculateEuclideanDistance,
  buildWaypointGraph,
  shortestPath,
  validateGraph,
  WaypointNode,
  WaypointEdge,
} from "../wayfinding";

// Mock SVG snippet
const SAMPLE_SVG = `
<svg viewBox="0 0 1000 800">
  <g id="rooms">
    <rect id="hall-1" x="100" y="100" width="80" height="80" />
    <rect id="hall-2" x="300" y="100" width="80" height="80" />
    <rect id="hall-isolated" x="900" y="700" width="50" height="50" />
  </g>
  <g id="waypoints">
    <circle id="wp-entrance" cx="100" cy="500" r="5" data-floor="1" />
    <circle id="wp-corridor-1" cx="100" cy="300" r="5" data-floor="1" />
    <circle id="wp-hall-1" cx="100" cy="200" r="5" data-floor="1" />
    <circle id="wp-hall-2" cx="300" cy="200" r="5" data-floor="1" />
    <circle id="wp-stairs-1" cx="100" cy="150" r="5" data-floor="1" />
    <circle id="wp-stairs-2" cx="100" cy="150" r="5" data-floor="2" />
    <circle id="wp-isolated" cx="900" cy="700" r="5" data-floor="1" />
  </g>
</svg>
`;

describe("Wayfinding Engine", () => {
  it("parseWaypointsFromSvg correctly extracts all nodes, coordinates and floors", () => {
    const nodes = parseWaypointsFromSvg(SAMPLE_SVG);
    assert.equal(nodes.length, 7);

    const entrance = nodes.find((n) => n.id === "wp-entrance");
    assert.ok(entrance);
    assert.equal(entrance?.x, 100);
    assert.equal(entrance?.y, 500);
    assert.equal(entrance?.floor, 1);
    assert.equal(entrance?.label, "Main Entrance Gate");

    const hall1Door = nodes.find((n) => n.id === "wp-hall-1");
    assert.ok(hall1Door);
    assert.equal(hall1Door?.zoneId, "hall-1");
    assert.equal(hall1Door?.label, "Hall 1 Entrance");

    const floor2Stairs = nodes.find((n) => n.id === "wp-stairs-2");
    assert.equal(floor2Stairs?.floor, 2);
  });

  it("calculateEuclideanDistance accurately computes distances with vertical penalty", () => {
    const n1: WaypointNode = { id: "a", x: 0, y: 0, floor: 1 };
    const n2: WaypointNode = { id: "b", x: 30, y: 40, floor: 1 };
    const dist2D = calculateEuclideanDistance(n1, n2);
    assert.equal(dist2D, 50); // 3-4-5 triangle

    const n3: WaypointNode = { id: "c", x: 30, y: 40, floor: 2 };
    const dist3D = calculateEuclideanDistance(n1, n3, 250);
    assert.equal(dist3D, 300); // 50 + 250
  });

  it("shortestPath finds the optimal route using A* and generates turn-by-turn steps", () => {
    const nodes = parseWaypointsFromSvg(SAMPLE_SVG);
    const edges: WaypointEdge[] = [
      { a: "wp-entrance", b: "wp-corridor-1" },
      { a: "wp-corridor-1", b: "wp-hall-1" },
      { a: "wp-hall-1", b: "wp-hall-2" },
      { a: "wp-hall-1", b: "wp-stairs-1" },
      { a: "wp-stairs-1", b: "wp-stairs-2", isStairOrLift: true },
    ];

    const graph = buildWaypointGraph(nodes, edges);

    // Test routing to hall-1 door
    const result1 = shortestPath(graph, "wp-entrance", "wp-hall-1");
    assert.equal(result1.found, true);
    assert.deepEqual(result1.pathNodeIds, ["wp-entrance", "wp-corridor-1", "wp-hall-1"]);
    assert.equal(result1.totalDistance, 300); // (500 - 300) + (300 - 200) = 300
    assert.ok(result1.steps.length >= 3);
    assert.ok(result1.steps[0].includes("Start at Main Entrance Gate"));

    // Test routing directly using zoneId "hall-2"
    const result2 = shortestPath(graph, "wp-entrance", "hall-2");
    assert.equal(result2.found, true);
    assert.deepEqual(result2.pathNodeIds, ["wp-entrance", "wp-corridor-1", "wp-hall-1", "wp-hall-2"]);

    // Test stair routing to upper floor
    const result3 = shortestPath(graph, "wp-entrance", "wp-stairs-2");
    assert.equal(result3.found, true);
    assert.ok(result3.steps.some((s) => s.includes("Take stairs/elevator")));
  });

  it("shortestPath returns found: false when target is disconnected", () => {
    const nodes = parseWaypointsFromSvg(SAMPLE_SVG);
    const edges: WaypointEdge[] = [
      { a: "wp-entrance", b: "wp-corridor-1" },
    ];
    const graph = buildWaypointGraph(nodes, edges);

    const result = shortestPath(graph, "wp-entrance", "wp-isolated");
    assert.equal(result.found, false);
    assert.deepEqual(result.pathNodeIds, []);
  });

  it("validateGraph correctly detects unreachable rooms and disconnected waypoints", () => {
    const nodes = parseWaypointsFromSvg(SAMPLE_SVG);
    const edges: WaypointEdge[] = [
      { a: "wp-entrance", b: "wp-corridor-1" },
      { a: "wp-corridor-1", b: "wp-hall-1" },
      // Note: hall-2 and hall-isolated are disconnected
    ];
    const graph = buildWaypointGraph(nodes, edges);

    const zones = [
      { id: "hall-1", label: "Hall 1" },
      { id: "hall-2", label: "Hall 2" },
      { id: "hall-isolated", label: "Isolated Arena" },
    ];

    const validation = validateGraph(graph, zones);
    assert.equal(validation.isValid, false);
    assert.ok(validation.unreachableRooms.includes("Hall 2"));
    assert.ok(validation.unreachableRooms.includes("Isolated Arena"));
    assert.ok(!validation.unreachableRooms.includes("Hall 1"));
    assert.ok(validation.disconnectedWaypoints.some((w) => w.includes("wp-isolated")));
  });
});
