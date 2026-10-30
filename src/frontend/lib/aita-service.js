export async function requestAita(action, args = {}, signal) {
  const response = await fetch('/api/aita', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...args }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Course service unavailable. Please retry.');
  return data;
}

export function materialForView(item) {
  if (!item || typeof item.item_id !== 'string' || !Array.isArray(item.speech_segments)) {
    throw new Error('The course service returned an invalid material.');
  }
  return {
    id: item.item_id, sequence: item.sequence, title: item.title,
    criterion: item.unit_code, summary: item.title, text: item.speech_segments,
    keywords: [], answer: '', nextItemId: item.next_item_id, previousItemId: item.previous_item_id
  };
}

export function explanationForView(result) {
  if (!result || !Array.isArray(result.sources) ||
      (typeof result.answer !== 'string' && !result.model_error)) {
    throw new Error('The course service returned an invalid explanation.');
  }
  const source = result.sources.map(item => typeof item === 'string' ? item :
    [item.unit_code, item.title, item.item_id].filter(Boolean).join(' — ')).join('; ');
  const noModel = result.model_error === 'no_model_configured';
  return {
    status: result.answer ? (result.grounding || 'Explanation') : noModel ? 'Context-only demo' : 'Model unavailable',
    body: result.answer || (noModel
      ? 'A model is not configured, so no AI explanation has been generated. You can review the course sources below.'
      : 'The model could not generate an explanation. Please try again.'),
    source,
    sourceLinks: [...new Map((result.source_materials || []).filter(item =>
      typeof item.item_id === 'string' && typeof item.unit_code === 'string'
    ).map(item => [item.item_id, {
      id: item.item_id, title: item.citation || item.title,
      href: `/learn?unit=${encodeURIComponent(item.unit_code)}&item=${encodeURIComponent(item.item_id)}`
    }])).values()],
    canSpeak: Boolean(result.answer)
  };
}
