import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeSvg,
  extractZonesFromSvg,
  formatZoneLabel,
  categorizeZone,
} from "../svgSanitizer";

describe("SVG Sanitizer & Security Validator", () => {
  test("allows clean valid SVG and preserves elements, IDs, and dimensions", () => {
    const cleanSvg = `
      <svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
        <rect id="hall-1" x="50" y="50" width="200" height="150" fill="#1C1917" />
        <path id="lab-1" d="M 300 50 L 500 50 L 500 200 Z" fill="#292524" />
        <circle id="wp-entrance" cx="100" cy="100" r="10" />
      </svg>
    `;

    const result = sanitizeSvg(cleanSvg);
    assert.equal(result.isValid, true);
    assert.ok(result.sanitized.includes('id="hall-1"'));
    assert.ok(result.sanitized.includes('id="lab-1"'));
    assert.ok(result.sanitized.includes('viewBox="0 0 1000 700"'));
  });

  test("rejects empty or non-SVG strings", () => {
    assert.equal(sanitizeSvg("").isValid, false);
    assert.equal(sanitizeSvg("   ").isValid, false);
    assert.equal(sanitizeSvg("<html><body>Not an SVG</body></html>").isValid, false);
    assert.equal(sanitizeSvg("<div><svg></svg></div>").isValid, true);
  });

  test("strips <script> tags completely", () => {
    const maliciousSvg = `
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <script type="text/javascript">
          alert('XSS Attack!');
          document.cookie = 'stolen';
        </script>
        <script src="https://evil.com/payload.js" />
        <rect id="hall-1" x="10" y="10" width="50" height="50" />
      </svg>
    `;

    const result = sanitizeSvg(maliciousSvg);
    assert.equal(result.isValid, true);
    assert.ok(!result.sanitized.includes("<script"));
    assert.ok(!result.sanitized.includes("alert("));
    assert.ok(!result.sanitized.includes("evil.com"));
    assert.ok(result.sanitized.includes('id="hall-1"'));
  });

  test("strips all on* event handler attributes", () => {
    const maliciousSvg = `
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" onload="fetch('https://evil.com')" onerror="alert(1)">
        <rect id="hall-1" x="10" y="10" width="50" height="50" onclick="alert(2)" onmouseover="stealTokens()" />
        <circle id="wp-1" cx="20" cy="20" r="5" onfocus="pwn()" />
      </svg>
    `;

    const result = sanitizeSvg(maliciousSvg);
    assert.equal(result.isValid, true);
    assert.ok(!result.sanitized.includes("onload="));
    assert.ok(!result.sanitized.includes("onerror="));
    assert.ok(!result.sanitized.includes("onclick="));
    assert.ok(!result.sanitized.includes("onmouseover="));
    assert.ok(!result.sanitized.includes("onfocus="));
    assert.ok(result.sanitized.includes('id="hall-1"'));
  });

  test("strips <foreignObject> elements", () => {
    const maliciousSvg = `
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <foreignObject width="100" height="100">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <iframe src="https://evil.com/phishing"></iframe>
          </div>
        </foreignObject>
        <rect id="hall-2" x="20" y="20" width="60" height="60" />
      </svg>
    `;

    const result = sanitizeSvg(maliciousSvg);
    assert.equal(result.isValid, true);
    assert.ok(!result.sanitized.includes("<foreignObject"));
    assert.ok(!result.sanitized.includes("<iframe"));
    assert.ok(result.sanitized.includes('id="hall-2"'));
  });

  test("strips external href/xlink:href while allowing safe internal fragment references", () => {
    const svgWithHrefs = `
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <linearGradient id="grad1" />
        </defs>
        <a href="javascript:alert(1)">
          <rect id="hall-1" fill="url(#grad1)" xlink:href="#grad1" href="https://malicious.org" />
        </a>
      </svg>
    `;

    const result = sanitizeSvg(svgWithHrefs);
    assert.equal(result.isValid, true);
    assert.ok(!result.sanitized.includes("javascript:"));
    assert.ok(!result.sanitized.includes("https://malicious.org"));
    assert.ok(result.sanitized.includes('xlink:href="#grad1"'));
  });

  test("strips dangerous CSS expressions and @import from <style> blocks", () => {
    const svgWithStyle = `
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <style>
          @import url("https://evil.com/hack.css");
          .room { fill: expression(alert('CSS XSS')); background-image: url('http://evil.com/track.png'); }
          .safe { fill: #FF6B1A; }
        </style>
        <rect id="hall-3" class="safe" x="10" y="10" width="30" height="30" />
      </svg>
    `;

    const result = sanitizeSvg(svgWithStyle);
    assert.equal(result.isValid, true);
    assert.ok(!result.sanitized.includes("@import"));
    assert.ok(!result.sanitized.includes("expression("));
    assert.ok(!result.sanitized.includes("http://evil.com"));
    assert.ok(result.sanitized.includes(".safe { fill: #FF6B1A; }"));
  });
});

describe("Zone Extraction & Label Formatting", () => {
  test("extracts room, hall, and amenity zones and strictly ignores wp-* waypoints", () => {
    const testSvg = `
      <svg viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
        <rect id="hall-1" x="10" y="10" width="100" height="100" />
        <rect id="hall-2" x="120" y="10" width="100" height="100" />
        <polygon id="audi-main" points="0,0 50,50 100,0" />
        <path id="amenity-restroom-1" d="M 0 0 L 10 10 Z" />
        <circle id="amenity-water-ground" cx="50" cy="50" r="10" />
        <!-- Waypoints layer: must all be excluded from competition zones -->
        <g id="waypoints">
          <circle id="wp-hall-1-door" cx="10" cy="20" r="5" />
          <circle id="wp-corridor-1" cx="30" cy="20" r="5" />
          <circle id="wp-stairs-f1" cx="50" cy="20" r="5" />
        </g>
        <rect id="background" width="1000" height="800" />
        <g id="walls" />
      </svg>
    `;

    const zones = extractZonesFromSvg(testSvg);
    const zoneIds = zones.map((z) => z.id);

    // Verified zone elements present
    assert.ok(zoneIds.includes("hall-1"));
    assert.ok(zoneIds.includes("hall-2"));
    assert.ok(zoneIds.includes("audi-main"));
    assert.ok(zoneIds.includes("amenity-restroom-1"));
    assert.ok(zoneIds.includes("amenity-water-ground"));

    // Waypoints must NOT be treated as competition zones
    assert.ok(!zoneIds.includes("wp-hall-1-door"));
    assert.ok(!zoneIds.includes("wp-corridor-1"));
    assert.ok(!zoneIds.includes("wp-stairs-f1"));

    // Structural elements ignored
    assert.ok(!zoneIds.includes("background"));
    assert.ok(!zoneIds.includes("walls"));
  });

  test("formatZoneLabel converts hyphenated IDs to readable English labels", () => {
    assert.equal(formatZoneLabel("hall-1"), "Hall 1");
    assert.equal(formatZoneLabel("hall-2-ground"), "Hall 2 Ground");
    assert.equal(formatZoneLabel("amenity-restroom-1"), "Restroom 1");
    assert.equal(formatZoneLabel("amenity-water-cooler"), "Water Cooler");
    assert.equal(formatZoneLabel("computer-lab-3"), "Computer Lab 3");
    assert.equal(formatZoneLabel("audi-main"), "Audi Main");
  });

  test("categorizeZone accurately distinguishes halls, amenities, and rooms", () => {
    assert.equal(categorizeZone("hall-1"), "hall");
    assert.equal(categorizeZone("audi-main"), "hall");
    assert.equal(categorizeZone("computer-lab-1"), "hall");
    assert.equal(categorizeZone("amenity-restroom-ground"), "amenity");
    assert.equal(categorizeZone("amenity-water-station"), "amenity");
    assert.equal(categorizeZone("food-court-area"), "room");
    assert.equal(categorizeZone("sponsor-booth-a"), "room");
  });
});

