import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyResult, parseRank } from "../results";

describe("Result classification", () => {
  it("maps coordinator result codes", () => {
    assert.equal(parseRank("FIRST"), 1);
    assert.equal(parseRank("SECOND"), 2);
    assert.equal(parseRank("THIRD"), 3);
    assert.deepEqual(classifyResult("FINALIST"), { kind: "award" });
    assert.deepEqual(classifyResult("SPECIAL"), { kind: "award" });
    assert.deepEqual(classifyResult("NONE"), { kind: "none" });
  });

  it("resolves runner-up wording before plain ordinals", () => {
    assert.equal(parseRank("First Runner-Up"), 2);
    assert.equal(parseRank("1st runner up"), 2);
    assert.equal(parseRank("Runner-up"), 2);
    assert.equal(parseRank("Second Runner-Up"), 3);
    assert.equal(parseRank("2nd Runner Up"), 3);
  });

  it("recognises free-text podium places", () => {
    assert.equal(parseRank("1st Place"), 1);
    assert.equal(parseRank("Winner"), 1);
    assert.equal(parseRank("Gold"), 1);
    assert.equal(parseRank("2nd"), 2);
    assert.equal(parseRank("Third Place"), 3);
    assert.equal(parseRank("3"), 3);
  });

  it("does not treat finalists or participation as podium places", () => {
    assert.equal(parseRank("Semi-finalist"), null);
    assert.deepEqual(classifyResult("Semi-finalist"), { kind: "award" });
    assert.deepEqual(classifyResult("Participated"), { kind: "none" });
    assert.deepEqual(classifyResult("Absent"), { kind: "none" });
    assert.deepEqual(classifyResult("Disqualified"), { kind: "none" });
    assert.deepEqual(classifyResult(""), { kind: "none" });
    assert.deepEqual(classifyResult(null), { kind: "none" });
  });
});
