export function validateMaterial(material) {
  return Boolean(
    material &&
      typeof material.id === "string" &&
      typeof material.criterion === "string" &&
      Number.isFinite(material.sequence) &&
      typeof material.title === "string" &&
      typeof material.summary === "string" &&
      Array.isArray(material.text) &&
      material.text.every((paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0) &&
      Array.isArray(material.keywords) &&
      material.keywords.every((keyword) => typeof keyword === "string" && keyword.trim().length > 0) &&
      typeof material.answer === "string"
  );
}

export function validateUnit(unit) {
  return Boolean(
    unit &&
      typeof unit.code === "string" &&
      typeof unit.name === "string" &&
      typeof unit.label === "string" &&
      unit.code.trim().length > 0
  );
}
