import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockMaterials } from "../data/mock-aita-data.js";
import { findBestMaterial } from "../lib/retrieval.js";

describe("Aita retrieval helper", () => {
  it("finds hazard material for a spoken-style hazard question", () => {
    const result = findBestMaterial("what should I do if I see something unsafe", mockMaterials);

    assert.equal(result.material.id, "construction-hazards");
    assert.equal(result.score > 0, true);
  });

  it("finds PPE material for a protective equipment question", () => {
    const result = findBestMaterial("why do I need gloves boots and a hard hat", mockMaterials);

    assert.equal(result.material.id, "ppe-on-site");
    assert.equal(result.score > 0, true);
  });

  it("returns zero score when material does not support the question", () => {
    const result = findBestMaterial("can I renew my driver licence online", mockMaterials);

    assert.equal(result.score, 0);
  });
});
