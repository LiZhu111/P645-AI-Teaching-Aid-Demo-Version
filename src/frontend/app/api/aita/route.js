import { callTool } from '@/lib/mcp-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  // Browser requests are same-origin; this prototype has no remote assessment API.
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  const expectedOrigin = `${requestUrl.protocol}//${request.headers.get('host') || requestUrl.host}`;
  if (origin && origin !== expectedOrigin) {
    return Response.json({ error: 'Cross-origin request refused.' }, { status: 403 });
  }
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  if (!input || typeof input !== 'object') return Response.json({ error: 'Invalid request.' }, { status: 400 });
  const unit = input.unit_code || 'DEMO101';
  if (typeof unit !== 'string' || !/^[A-Z0-9]{5,20}$/.test(unit)) {
    return Response.json({ error: 'Invalid unit code.' }, { status: 400 });
  }
  try {
    let result;
    switch (input.action) {
      case 'units': result = await callTool('list_units'); break;
      case 'outline': result = await callTool('get_unit_outline', { unit_code: unit }); break;
      case 'material':
        if (typeof input.item_id !== 'string' || input.item_id.length > 200) return Response.json({ error: 'Invalid material ID.' }, { status: 400 });
        result = await callTool('get_material', { unit_code: unit, item_id: input.item_id }); break;
      case 'feedback': {
        if (!['correct', 'incorrect'].includes(input.case_id)) return Response.json({ error: 'Choose a demonstration case.' }, { status: 400 });
        // Only fixed synthetic records; never accept browser-supplied marking decisions.
        result = await callTool('explain_marked_answer', {
          question_id: 'DEMO101:a1:s1:q1', marked_correct: input.case_id === 'correct',
          marked_by: 'assessor:synthetic-demo', student_response: ''
        });
        result.demo_notice = `Demonstration only: this case simulates a human assessor marking an answer ${input.case_id}. No real learner has been assessed.`;
        break;
      }
      case 'ask':
      case 'search': {
        if (typeof input.question !== 'string' || !input.question.trim() || input.question.length > 2000) {
          return Response.json({ error: 'Enter a question of up to 2000 characters.' }, { status: 400 });
        }
        const args = { unit_code: unit };
        if (Number.isInteger(input.near_sequence)) args.near_sequence = input.near_sequence;
        result = await callTool(input.action === 'ask' ? 'explain_concept' : 'search_material', {
          ...args, [input.action === 'ask' ? 'question' : 'query']: input.question.trim()
        });
        break;
      }
      default: return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }
    // Prompts may contain assessment guides. Never serialize internal prompts to the browser.
    if (result && !Array.isArray(result)) {
      const { prompt: _prompt, system_prompt: _system, ...publicResult } = result;
      void _prompt; void _system;
      result = publicResult;
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Course service unavailable or timed out. Please retry.' }, { status: 503 });
  }
}
