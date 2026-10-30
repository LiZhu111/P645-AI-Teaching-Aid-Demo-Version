const MIN_SEARCH_WORD_LENGTH = 3;
const STOP_WORDS = new Set([
  "and",
  "are",
  "can",
  "for",
  "how",
  "the",
  "what",
  "when",
  "where",
  "why",
  "with",
  "you",
  "your"
]);

export function findBestMaterial(question, materials, fallbackIndex = 0) {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= MIN_SEARCH_WORD_LENGTH && !STOP_WORDS.has(word));

  return materials.reduce(
    (best, material) => {
      const sourceText = getSearchableText(material);
      const score = words.reduce((total, word) => total + (sourceText.includes(word) ? 1 : 0), 0);
      return score > best.score ? { material, score } : best;
    },
    { material: materials[fallbackIndex], score: 0 }
  );
}

function getSearchableText(material) {
  return `${material.title} ${material.summary} ${material.text.join(" ")} ${material.keywords.join(" ")}`.toLowerCase();
}
