import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateZoneExists, extractZonesFromSvg } from "../svgSanitizer";

describe("Zone Validation & Floor Plan Fallback", () => {
  test("optional zone IDs (null, undefined, empty string) pass validation", async () => {
    assert.equal(await validateZoneExists(null), true);
    assert.equal(await validateZoneExists(undefined), true);
    assert.equal(await validateZoneExists(""), true);
    assert.equal(await validateZoneExists("   "), true);
  });

  test("validates against active floor plan zones correctly", async () => {
    // The active floor plan in public/uploads/campus-floorplan.svg contains hall-1, hall-2, etc.
    const isValid = await validateZoneExists("hall-1");
    assert.equal(isValid, true);

    const isPrelimsValid = await validateZoneExists("hall-2");
    assert.equal(isPrelimsValid, true);

    // Case-insensitivity
    const isCaseInsensitive = await validateZoneExists("HALL-1");
    assert.equal(isCaseInsensitive, true);

    // Unregistered fake zone
    const isFakeValid = await validateZoneExists("non-existent-hall-9999");
    assert.equal(isFakeValid, false);
  });

  test("extractZonesFromSvg handles edge cases gracefully", () => {
    assert.deepEqual(extractZonesFromSvg(""), []);
    assert.deepEqual(extractZonesFromSvg("random text with no svg tags"), []);

    const singleZoneSvg = `<svg><rect id="main-stage" /></svg>`;
    const zones = extractZonesFromSvg(singleZoneSvg);
    assert.equal(zones.length, 1);
    assert.equal(zones[0].id, "main-stage");
    assert.equal(zones[0].label, "Main Stage");
  });
});
