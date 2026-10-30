import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockMaterials, mockUnit } from "../data/mock-aita-data.js";
import { validateMaterial, validateUnit } from "../lib/data-contract.js";

describe("Aita frontend data contract", () => {
  it("accepts the current mock unit shape", () => {
    assert.equal(validateUnit(mockUnit), true);
  });

  it("accepts every current mock material item", () => {
    assert.equal(mockMaterials.length > 0, true);
    assert.deepEqual(
      mockMaterials.map((material) => validateMaterial(material)),
      mockMaterials.map(() => true)
    );
  });

  it("requires the fields needed by the UI and retrieval flow", () => {
    assert.equal(
      validateMaterial({
        id: "missing-answer",
        criterion: "Criterion 1.1",
        sequence: 1,
        title: "Missing Answer",
        summary: "Invalid material",
        text: ["Valid paragraph"],
        keywords: ["valid"]
      }),
      false
    );
  });
});
