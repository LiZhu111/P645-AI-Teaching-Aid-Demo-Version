import { ActionStatus } from "@/components/ActionStatus";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { appCopy } from "@/config/app-copy";

export function QuestionPanel({
  autoSpeak,
  isListening,
  onQuestionChange,
  onSubmitQuestion,
  onSelectQuestion,
  onToggleAutoSpeak,
  onVoiceInput,
  question,
  questions,
  voiceStatus
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <SectionHeader eyebrow={appCopy.questionPanel.eyebrow} title={appCopy.questionPanel.title} />

      <VoiceInputButton
        activeLabel={appCopy.questionPanel.listeningButton}
        idleLabel={appCopy.questionPanel.speakQuestionButton}
        isListening={isListening}
        onClick={onVoiceInput}
      />
      <ActionStatus message={voiceStatus.message} tone={voiceStatus.tone} />

      <form className="mb-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmitQuestion(); }}>
      <textarea
        className="mt-4 min-h-28 w-full resize-y rounded-lg border border-slate-300 p-3 leading-6"
        onChange={(event) => onQuestionChange(event.target.value)}
        placeholder={appCopy.questionPanel.placeholder}
        rows={4}
        value={question}
      />
      <button className="inline-flex min-h-11 w-32 items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" type="submit">Ask Aita</button>
      </form>

      <div className="mb-3 grid gap-2" aria-label="Example questions">
        {questions.map((example) => (
          <button
            className="min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:bg-blue-50"
            key={example}
            onClick={() => onSelectQuestion(example)}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
          <input checked={autoSpeak} onChange={(event) => onToggleAutoSpeak(event.target.checked)} type="checkbox" />
          {appCopy.autoReadLabel}
        </label>
      </div>
    </div>
  );
}
