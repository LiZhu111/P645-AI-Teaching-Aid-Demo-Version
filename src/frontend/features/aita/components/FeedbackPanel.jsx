import { AudioToggleButton } from "@/components/AudioToggleButton";
import { ActionStatus } from "@/components/ActionStatus";
import { appConfig } from "@/config/app-config";
import { appCopy } from "@/config/app-copy";
import { VoiceInputButton } from "@/components/VoiceInputButton";

export function FeedbackPanel({ audioStatus, feedback, feedbackStatus, isListening, isSpeaking, onToggleAudio, onStatusChange, onVoiceInput, voiceStatus, showAudioControl = true, showAssessmentControls = true }) {
  const sourceMarker = "Source:";
  const sourceStart = feedback.indexOf(sourceMarker);
  const explanation = sourceStart >= 0 ? feedback.slice(0, sourceStart).trim() : feedback;
  const source = sourceStart >= 0 ? feedback.slice(sourceStart + sourceMarker.length).trim() : "";

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">{appCopy.feedbackPanel.eyebrow}</p>
        <h3 className="text-xl font-bold">{appCopy.feedbackPanel.title}</h3>
      </div>

      {showAssessmentControls ? <label className="grid gap-2 text-sm font-bold text-slate-800">
        Pre-marked demonstration case
      <select
        aria-label="Assessor decision"
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
        onChange={(event) => onStatusChange(event.target.value)}
        value={feedbackStatus}
      >
        {appConfig.feedback.statuses.map((status) => (
          <option key={status} value={status}>
            {appCopy.feedbackPanel.statuses[status]}
          </option>
        ))}
      </select>
      </label> : null}
      <p className="text-sm text-slate-600">Synthetic demo course examples only. Choosing a case does not mark an answer.</p>
      {showAssessmentControls ? <button type="button" className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white" onClick={() => onStatusChange(feedbackStatus)}>Explain this case</button> : null}

      <div className={`rounded-lg border p-3 text-sm font-bold ${feedbackStatus === "correct" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        {appCopy.feedbackPanel.statuses[feedbackStatus]}
      </div>

      {onVoiceInput ? <div><VoiceInputButton activeLabel="Stop" idleLabel="Speak" isListening={isListening} onClick={onVoiceInput} /><ActionStatus message={voiceStatus.message} tone={voiceStatus.tone} /></div> : null}

      {showAudioControl ? <AudioToggleButton
        activeLabel={appCopy.readerActions.stop}
        idleLabel={appCopy.feedbackPanel.readButton}
        isActive={isSpeaking}
        onToggle={onToggleAudio}
      /> : null}
      {showAudioControl ? <ActionStatus message={audioStatus.message} tone={audioStatus.tone} /> : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Aita explanation</p>
        <p className="mt-2 leading-7 text-slate-700">{explanation}</p>
        {source ? <p className="mt-3 border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-900"><strong>Source:</strong> {source}</p> : null}
      </div>
      <p className="text-sm text-slate-500">Aita explains the assessor&apos;s decision. It does not mark answers or provide a model-answer key.</p>
    </section>
  );
}
