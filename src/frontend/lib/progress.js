export function progressKey(email, unitCode) {
  const learner = email ? `user:${email.trim().toLowerCase()}` : 'guest';
  return `aita:progress:v1:${encodeURIComponent(learner)}:${encodeURIComponent(unitCode)}`;
}

export function readProgress(raw, materials) {
  const empty = { startedMaterialIds: [], selectedMaterialId: null, speechSegment: 0 };
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.startedMaterialIds)) return empty;
    const ids = new Set(materials.map(material => material.id));
    const progress = {
      startedMaterialIds: [...new Set(data.startedMaterialIds.filter(id => ids.has(id)))],
      selectedMaterialId: ids.has(data.selectedMaterialId) ? data.selectedMaterialId : null,
      speechSegment: Number.isInteger(data.speechSegment) && data.speechSegment >= 0 ? data.speechSegment : 0
    };
    if (Object.hasOwn(data, "speechOffset")) progress.speechOffset = Number.isInteger(data.speechOffset) && data.speechOffset >= 0 ? data.speechOffset : null;
    if (Object.hasOwn(data, "speechSentence")) progress.speechSentence = Number.isInteger(data.speechSentence) && data.speechSentence > 0 ? data.speechSentence : 0;
    return progress;
  } catch { return empty; }
}

export function startMaterial(raw, materials, materialId) {
  const progress = readProgress(raw, materials);
  if (!materials.some(material => material.id === materialId)) return progress;
  const next = {
    startedMaterialIds: [...new Set([...progress.startedMaterialIds, materialId])],
    selectedMaterialId: materialId,
    speechSegment: 0
  };
  if (Object.hasOwn(progress, "speechOffset") || Object.hasOwn(progress, "speechSentence")) {
    next.speechOffset = null;
    next.speechSentence = 0;
  }
  return next;
}

export function saveSpeechSegment(raw, materials, materialId, speechSegment) {
  const progress = readProgress(raw, materials);
  if (!materials.some(material => material.id === materialId)) return progress;
  const next = {
    ...progress,
    startedMaterialIds: [...new Set([...progress.startedMaterialIds, materialId])],
    selectedMaterialId: materialId,
    speechSegment: Number.isInteger(speechSegment) && speechSegment >= 0 ? speechSegment : 0
  };
  if (Object.hasOwn(progress, "speechOffset") || Object.hasOwn(progress, "speechSentence")) {
    next.speechOffset = null;
    next.speechSentence = 0;
  }
  return next;
}

export function saveSpeechPosition(raw, materials, materialId, speechSegment, speechOffset, speechSentence) {
  const progress = readProgress(raw, materials);
  if (!materials.some(material => material.id === materialId)) return progress;
  return {
    ...progress,
    startedMaterialIds: [...new Set([...progress.startedMaterialIds, materialId])],
    selectedMaterialId: materialId,
    speechSegment: Number.isInteger(speechSegment) && speechSegment >= 0 ? speechSegment : 0,
    speechOffset: Number.isInteger(speechOffset) && speechOffset >= 0 ? speechOffset : 0,
    speechSentence: Number.isInteger(speechSentence) && speechSentence > 0 ? speechSentence : 1
  };
}

export function getSentencePosition(text, characterIndex) {
  const offset = Math.max(0, Math.min(text.length, characterIndex));
  const sentenceBoundary = /[.!?]+(?:["'”’»)]*)\s+/gu;
  let sentenceStart = 0;
  let sentence = 1;
  for (const match of text.matchAll(sentenceBoundary)) {
    const boundaryEnd = match.index + match[0].length;
    if (boundaryEnd > offset) break;
    sentenceStart = boundaryEnd;
    sentence += 1;
  }
  return { offset: sentenceStart, sentence };
}

export function getParagraphStartOffset(paragraphs, paragraphIndex) {
  return paragraphs.slice(0, Math.max(0, paragraphIndex)).reduce((offset, paragraph) => offset + paragraph.length + 1, 0);
}

export function getParagraphIndex(paragraphs, characterIndex) {
  let offset = 0;
  for (let index = 0; index < paragraphs.length; index += 1) {
    const end = offset + paragraphs[index].length;
    if (characterIndex <= end || index === paragraphs.length - 1) return index;
    offset = end + 1;
  }
  return 0;
}
